/**
 * PyFree HTTP 모듈
 * Express.js 스타일의 라우팅 지원
 */

import http from 'http';
import { URL } from 'url';

export interface Request {
  method: string;
  path: string;
  query: Map<string, string>;
  body: any;
  headers: Map<string, string>;
  params: Map<string, string>;
}

export interface Response {
  status: number;
  json(data: any): void;
  text(data: string): void;
  send(data: string): void;
  header(name: string, value: string): void;
}

export type RouteHandler = (
  req: Request,
  res: Response
) => Promise<void> | void;

export class HTTPServer {
  private routes: Map<string, RouteHandler> = new Map();
  private port: number = 3000;
  private server: http.Server | null = null;
  private isRunning: boolean = false;
  private responseHeaders: Map<string, string> = new Map();

  constructor(port: number = 3000) {
    this.port = port;
  }

  /**
   * GET 메서드 라우팅
   */
  get(path: string, handler: RouteHandler): HTTPServer {
    this.routes.set(`GET ${path}`, handler);
    return this;
  }

  /**
   * POST 메서드 라우팅
   */
  post(path: string, handler: RouteHandler): HTTPServer {
    this.routes.set(`POST ${path}`, handler);
    return this;
  }

  /**
   * PUT 메서드 라우팅
   */
  put(path: string, handler: RouteHandler): HTTPServer {
    this.routes.set(`PUT ${path}`, handler);
    return this;
  }

  /**
   * DELETE 메서드 라우팅
   */
  delete(path: string, handler: RouteHandler): HTTPServer {
    this.routes.set(`DELETE ${path}`, handler);
    return this;
  }

  /**
   * 서버 시작
   */
  listen(): HTTPServer {
    if (this.isRunning) {
      console.warn('Server is already running');
      return this;
    }

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(this.port, () => {
      this.isRunning = true;
      console.log(`Server running on http://localhost:${this.port}`);
    });

    return this;
  }

  /**
   * 서버 중지
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      this.isRunning = false;
    }
  }

  /**
   * 포트 반환
   */
  getPort(): number {
    return this.port;
  }

  /**
   * 요청 처리
   */
  private handleRequest(
    httpReq: http.IncomingMessage,
    httpRes: http.ServerResponse
  ): void {
    const method = httpReq.method || 'GET';
    const url = new URL(httpReq.url || '', `http://localhost:${this.port}`);
    const path = url.pathname;

    // 경로 매칭 (정확한 매칭 또는 파라미터 매칭)
    let handler: RouteHandler | undefined;
    let params: Map<string, string> = new Map();

    const routeKey = `${method} ${path}`;
    handler = this.routes.get(routeKey);

    // 파라미터 매칭 (/users/:id 형태)
    if (!handler) {
      for (const [key, h] of this.routes.entries()) {
        const [routeMethod, routePath] = key.split(' ');
        if (routeMethod === method && this.matchRoute(routePath, path, params)) {
          handler = h;
          break;
        }
      }
    }

    if (!handler) {
      httpRes.statusCode = 404;
      httpRes.end('Not Found');
      return;
    }

    // Request/Response 객체 생성
    const request = this.createRequest(httpReq, path, params);
    const response = this.createResponse(httpRes);

    // 핸들러 실행
    Promise.resolve(handler(request, response)).catch((err) => {
      console.error('Handler error:', err);
      httpRes.statusCode = 500;
      httpRes.end('Internal Server Error');
    });
  }

  /**
   * 경로 매칭 (/users/:id 형태)
   */
  private matchRoute(
    routePath: string,
    actualPath: string,
    params: Map<string, string>
  ): boolean {
    const routeParts = routePath.split('/').filter((p) => p);
    const actualParts = actualPath.split('/').filter((p) => p);

    if (routeParts.length !== actualParts.length) {
      return false;
    }

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        const paramName = routeParts[i].substring(1);
        params.set(paramName, actualParts[i]);
      } else if (routeParts[i] !== actualParts[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Request 객체 생성
   */
  private createRequest(
    httpReq: http.IncomingMessage,
    path: string,
    params: Map<string, string>
  ): Request {
    const url = new URL(httpReq.url || '', `http://localhost:${this.port}`);
    const query = new Map<string, string>();

    url.searchParams.forEach((value, key) => {
      query.set(key, value);
    });

    const headers = new Map<string, string>();
    Object.entries(httpReq.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      }
    });

    return {
      method: httpReq.method || 'GET',
      path,
      query,
      body: {},
      headers,
      params,
    };
  }

  /**
   * Response 객체 생성
   */
  private createResponse(httpRes: http.ServerResponse): Response {
    const response: Response = {
      status: 200,
      json: (data: any) => {
        httpRes.statusCode = response.status;
        httpRes.setHeader('Content-Type', 'application/json');
        httpRes.end(JSON.stringify(data));
      },
      text: (data: string) => {
        httpRes.statusCode = response.status;
        httpRes.setHeader('Content-Type', 'text/plain');
        httpRes.end(data);
      },
      send: (data: string) => {
        httpRes.statusCode = response.status;
        httpRes.end(data);
      },
      header: (name: string, value: string) => {
        httpRes.setHeader(name, value);
      },
    };

    return response;
  }
}

/**
 * HTTP 서버 팩토리 함수
 */
export function createHTTPServer(port: number = 3000): HTTPServer {
  return new HTTPServer(port);
}
