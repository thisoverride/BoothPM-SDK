jest.mock('axios', () => jest.fn());

import axios from 'axios';
import HttpClient from '../../lib/core/api/HttpClient';

const mockedAxios = axios as unknown as jest.Mock;

describe('HttpClient', () => {
  beforeEach(() => {
    mockedAxios.mockReset();
  });

  it('sends no cookies by default (no personal secrets baked in)', async () => {
    mockedAxios.mockResolvedValue({ data: { ok: true } });
    const client = new HttpClient({ lang: 'en' });

    await client.get('items/1');

    expect(mockedAxios).toHaveBeenCalledTimes(1);
    const options = mockedAxios.mock.calls[0][0];
    expect(options.headers.Cookie).toBe('');
  });

  it('serializes configured cookies into the Cookie header', async () => {
    mockedAxios.mockResolvedValue({ data: {} });
    const client = new HttpClient({ lang: 'en', cookies: { a: '1', b: '2' } });

    await client.get('items/1');

    const options = mockedAxios.mock.calls[0][0];
    expect(options.headers.Cookie).toBe('a=1; b=2');
  });

  it('builds the request URL from the base URL, language and endpoint', async () => {
    mockedAxios.mockResolvedValue({ data: {} });
    const client = new HttpClient({ lang: 'ja' });

    await client.get('items/42');

    const options = mockedAxios.mock.calls[0][0];
    expect(options.url).toBe('https://booth.pm/ja/items/42');
    expect(options.method).toBe('GET');
  });

  it('bypasses the base URL when useBaseUrl is false', async () => {
    mockedAxios.mockResolvedValue({ data: {} });
    const client = new HttpClient({ lang: 'en' });

    await client.get('https://booth.pm/autocomplete/tag.json?term=x', undefined, false);

    const options = mockedAxios.mock.calls[0][0];
    expect(options.url).toBe('https://booth.pm/autocomplete/tag.json?term=x');
  });

  it('resolves with the response data', async () => {
    mockedAxios.mockResolvedValue({ data: { hello: 'world' } });
    const client = new HttpClient({ lang: 'en' });

    await expect(client.get('items/1')).resolves.toEqual({ hello: 'world' });
  });

  it('stream() requests a stream response with the html Accept/Content-Type headers', async () => {
    mockedAxios.mockResolvedValue({ data: 'fake-stream' });
    const client = new HttpClient({ lang: 'en' });

    await client.stream('https://booth.pm/downloadables/1');

    const options = mockedAxios.mock.calls[0][0];
    expect(options.responseType).toBe('stream');
    expect(options.headers.Accept).toBe('*/*');
    expect(options.headers['Content-Type']).toBeUndefined();
    expect(options.url).toBe('https://booth.pm/downloadables/1');
  });

  it('propagates errors from the underlying request', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockedAxios.mockRejectedValue(new Error('network down'));
    const client = new HttpClient({ lang: 'en' });

    await expect(client.get('items/1')).rejects.toThrow('network down');
    spy.mockRestore();
  });
});
