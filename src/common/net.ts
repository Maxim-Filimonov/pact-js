/**
 * Network module.
 * @module net
 * @private
 */

import * as net from 'net';
import { Promise as bluebird } from 'bluebird';

export const localAddresses = ['127.0.0.1', 'localhost', '0.0.0.0', '::1'];

export const portCheck = (port: number, host: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const server = net
      .createServer()
      .listen({ port, host, exclusive: true })
      .on('error', (e: NodeJS.ErrnoException) => {
        if (e.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is unavailable on address ${host}`));
        } else {
          reject(e);
        }
      })
      .on('listening', () => {
        server.once('close', () => resolve()).close();
      });
  });

export const isPortAvailable = (port: number, host: string): Promise<void> =>
  Promise.resolve(
    bluebird
      .map(
        localAddresses,
        // we meed to wrap the built-in Promise with bluebird.reflect() so we can
        // test the result of the promise without failing bluebird.map()
        (h) => bluebird.resolve(portCheck(port, h)).reflect(),
        // do each port check sequentially (as localhost & 127.0.0.1 will conflict on most default environments)
        { concurrency: 1 }
      )
      .then((inspections) => {
        // if every port check failed, then fail the `isPortAvailable` check
        if (inspections.every((inspection) => !inspection.isFulfilled())) {
          return Promise.reject(
            new Error(`Cannot open port ${port} on ipv4 or ipv6 interfaces`)
          );
        }

        // the local addresses passed - now check the host that the user has specified
        return portCheck(port, host);
      })
  );

export const freePort = (): Promise<number> => {
  return new Promise((res) => {
    const s = net.createServer();
    s.listen(0, () => {
      const port = s.address().port;
      s.close(() => res(port));
    });
  });
};
