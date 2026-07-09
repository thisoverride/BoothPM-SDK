import axios, { type AxiosRequestConfig } from 'axios';
import type { Config } from '../../@types/BoothSDK';
import ApiEndpoints from './ApiEndPoint';

export default class HttpClient {
  private readonly BASE_URL: string;
  private readonly cookies: Record<string, string>;

  constructor (config: Config) {
    this.BASE_URL = ApiEndpoints.BASE_URL + config.lang;
    this.cookies = config.cookies ?? {};
  }

  private getCookiesString (): string {
    return Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  private async _request<T>(method: string, endpoint: string, useBaseUrl: boolean, data?: any, params: any = {}, basicHeader?: boolean): Promise<T> {
    const urlPath: string = useBaseUrl ? `${this.BASE_URL}/${endpoint}` : endpoint;
    const headers: any = {
      Accept: basicHeader ? '*/*' : 'application/json',
      Cookie: this.getCookiesString()
    };

    if (!params.responseType || params.responseType !== 'stream') {
      headers['Content-Type'] = basicHeader ? 'text/html' : 'application/json;charset=utf-8';
    }

    const options: AxiosRequestConfig = {
      method: method.toUpperCase(),
      url: urlPath,
      headers,
      params: method.toUpperCase() === 'GET' ? params : undefined,
      data: method.toUpperCase() !== 'GET' ? data : undefined,
      responseType: params.responseType
    };

    try {
      return (await axios(options)).data;
    } catch (error: any) {
      console.log(error);
      throw error;
    }
  }

  public async get<T>(endpoint: string, params?: any, useBaseUrl = true): Promise<T> {
    return await this._request('GET', endpoint, useBaseUrl, undefined, params, false);
  }

  public async stream<T>(endpoint: string): Promise<T> {
    return await this._request('GET', endpoint, false, undefined, { responseType: 'stream' }, true);
  }
}
