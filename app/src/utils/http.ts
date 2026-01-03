import axios from 'axios';
import { getRuntimeEnv } from './runtimeEnv';

// Instância padrão para requisições HTTP no front-end.
// Usa NEXT_PUBLIC_API_BASE_URL para que a variável esteja disponível no browser.
export const http = axios.create({
  baseURL: getRuntimeEnv().apiBaseUrl || undefined,
});

export default http;
