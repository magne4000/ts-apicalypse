import axios, { AxiosRequestConfig } from 'axios';
import { pipe, Stringifiable } from "./builder";

interface Options extends AxiosRequestConfig {
  queryMethod?: 'url' | 'body',
}

export function apicalypse(builder: Stringifiable, options: Options = {}) {

  function getAxiosRequestConfig(url: string) {
    const opts: Options = {
      queryMethod: 'body',
      ...options,
      url: url,
    };

    const raw = builder.toApicalypseString();

    if (options.queryMethod ===  'url') {
      opts.params = {
        apicalypse: encodeURIComponent(raw),
      };
    } else if (options.queryMethod ===  'body') {
      opts.data = raw;
    }

    return opts;
  }

  return {
    execute(url: string) {
      return axios.create()(getAxiosRequestConfig(url));
    }
  }
}
