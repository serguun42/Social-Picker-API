import { exec } from 'node:child_process';

import { GalleryDLPlatform, GalleryDLResponse } from '../../types/gallery-dl.js';
import loadConfig from '../../util/load-configs.js';

const { PROXY_HOSTNAME, PROXY_PORT } = loadConfig('service');

/**
 * Downloads media from a post (platform-agnostic) using gallery-dl
 *
 * @param link Post full URL
 * @param cookiesFileLocation Optional cookies file location
 */
export default function galleryDL<P extends GalleryDLPlatform>(
  link: string,
  cookiesFileLocation?: string
): Promise<GalleryDLResponse<P>> {
  return new Promise((galleryDLBinaryResolve: (readOutput: string) => void, galleryDLBinaryReject) => {
    const galleryDLBinaryCommand = [
      'gallery-dl',
      ...(cookiesFileLocation ? ['--cookies', cookiesFileLocation, '--cookies-export', cookiesFileLocation] : []),
      ...(PROXY_HOSTNAME && PROXY_PORT ? ['--proxy', `socks5h://${PROXY_HOSTNAME}:${PROXY_PORT}`] : []),
      '--dump-json',
      link,
    ]
      .filter(Boolean)
      .join(' ');

    const stdoutChunks: string[] = [];

    const galleryDLBinaryProcess = exec(galleryDLBinaryCommand, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error || stderr) {
        galleryDLBinaryProcess.kill();
        galleryDLBinaryReject(error || new Error(stderr));
      }
    });

    if (galleryDLBinaryProcess.stdout)
      galleryDLBinaryProcess.stdout.on('data', (chunk) => {
        stdoutChunks.push(chunk.toString());
      });

    if (galleryDLBinaryProcess.stderr)
      galleryDLBinaryProcess.stderr.on('data', (chunk) => {
        galleryDLBinaryReject(new Error(chunk.toString()));
      });

    galleryDLBinaryProcess.on('error', (e) => galleryDLBinaryReject(e));
    galleryDLBinaryProcess.on('exit', (code, signal) => {
      if (!code) galleryDLBinaryResolve(stdoutChunks.join(''));
      else galleryDLBinaryReject(new Error(`gallery-dl exited with code ${code}${signal ? `/signal ${signal}` : ''}`));
    });
  }).then((readOutput) => JSON.parse(readOutput) as GalleryDLResponse<P>);
}
