import axios from 'axios';

// Instância padrão para requisições HTTP no front-end.
// Usa NEXT_PUBLIC_API_BASE_URL para que a variável esteja disponível no browser.
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export default http;
