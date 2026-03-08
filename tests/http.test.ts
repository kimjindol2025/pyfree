/**
 * PyFree HTTP 모듈 테스트
 *
 * 커버리지:
 * - HTTP 서버 생성
 * - 라우팅 (GET, POST, PUT, DELETE)
 * - 요청/응답 처리
 */

import { BUILTINS_MAP } from '../src/stdlib/builtins';

describe('PyFreeHTTP - 서버 생성', () => {
  test('http_server() - HTTP 서버 생성', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(3000);

    expect(server.__type).toBe('http_server');
    expect(server.port).toBe(3000);
    expect(server.isRunning).toBe(false);
  });

  test('http_server() - 기본 포트 3000', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server();

    expect(server.port).toBe(3000);
  });

  test('http_server() - 커스텀 포트', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(8080);

    expect(server.port).toBe(8080);
  });
});

describe('PyFreeHTTP - 라우팅', () => {
  test('get() - GET 라우팅', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(3000);
    const handler = () => {};

    server.get('/api/users', handler);

    expect(server.routes.has('GET /api/users')).toBe(true);
  });

  test('post() - POST 라우팅', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(3000);
    const handler = () => {};

    server.post('/api/users', handler);

    expect(server.routes.has('POST /api/users')).toBe(true);
  });

  test('put() - PUT 라우팅', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(3000);
    const handler = () => {};

    server.put('/api/users/1', handler);

    expect(server.routes.has('PUT /api/users/1')).toBe(true);
  });

  test('delete() - DELETE 라우팅', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(3000);
    const handler = () => {};

    server.delete('/api/users/1', handler);

    expect(server.routes.has('DELETE /api/users/1')).toBe(true);
  });

  test('메서드 체이닝', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(3000);
    const handler = () => {};

    const result = server.get('/', handler).post('/api', handler);

    expect(result).toBe(server);
    expect(server.routes.size).toBe(2);
  });
});

describe('PyFreeHTTP - 서버 제어', () => {
  test('listen() - 서버 시작', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(3000);
    server.listen();

    expect(server.isRunning).toBe(true);
  });

  test('stop() - 서버 중지', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(3000);
    server.listen();
    server.stop();

    expect(server.isRunning).toBe(false);
  });

  test('http_listen() - HTTP 리스너 함수', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;
    const http_listen = BUILTINS_MAP.get('http_listen') as Function;

    const server = http_server(3000);
    http_listen(server, 8080);

    expect(server.isRunning).toBe(true);
    expect(server.port).toBe(8080);
  });
});

describe('PyFreeHTTP - 함수 등록', () => {
  test('HTTP 함수 등록 확인', () => {
    const httpNames = ['http_server', 'http_listen'];

    httpNames.forEach((name) => {
      expect(BUILTINS_MAP.has(name)).toBe(true);
    });
  });

  test('HTTPServer 인터페이스 검증', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(3000);

    // HTTPServer 메서드 확인
    expect(typeof server.get).toBe('function');
    expect(typeof server.post).toBe('function');
    expect(typeof server.put).toBe('function');
    expect(typeof server.delete).toBe('function');
    expect(typeof server.listen).toBe('function');
    expect(typeof server.stop).toBe('function');
  });
});

describe('PyFreeHTTP - 라우팅 저장소', () => {
  test('라우트 저장 및 조회', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(3000);
    const handler1 = () => 'handler1';
    const handler2 = () => 'handler2';

    server.get('/path1', handler1);
    server.post('/path2', handler2);

    expect(server.routes.get('GET /path1')).toBe(handler1);
    expect(server.routes.get('POST /path2')).toBe(handler2);
  });

  test('같은 경로 다른 메서드', () => {
    const http_server = BUILTINS_MAP.get('http_server') as Function;

    const server = http_server(3000);
    const handler1 = () => 'get';
    const handler2 = () => 'post';

    server.get('/api/resource', handler1);
    server.post('/api/resource', handler2);

    expect(server.routes.size).toBe(2);
    expect(server.routes.get('GET /api/resource')).toBe(handler1);
    expect(server.routes.get('POST /api/resource')).toBe(handler2);
  });
});
