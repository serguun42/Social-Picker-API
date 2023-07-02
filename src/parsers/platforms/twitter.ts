import { stat } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { SocialPost } from '../../types/social-post.js';
import LoadConfig from '../../util/load-configs.js';

const { TWITTER_SCAPPER } = LoadConfig('tokens');

export default function Twitter(url: URL): Promise<SocialPost | undefined> {
  const statusID = url.pathname.match(/^(?:\/[\w_]+)?\/status(?:es)?\/(\d+)/)?.[1];
  if (!statusID) return Promise.resolve(undefined);

  return stat(TWITTER_SCAPPER.binary_file_path)
    .then((stats) => {
      if (!stats.isFile()) return Promise.reject(new Error(`${TWITTER_SCAPPER.binary_file_path} is not a file`));

      return new Promise((goBinaryResolve: (readOutput: string) => void, goBinaryReject) => {
        const goBinaryCommand = [
          TWITTER_SCAPPER.binary_file_path,
          'getTweet',
          TWITTER_SCAPPER.cookies_file_path,
          statusID,
        ].join(' ');

        const stdoutChunks: string[] = [];

        const goBinaryProcess = exec(goBinaryCommand, { cwd: process.cwd() }, (error, stdout, stderr) => {
          if (error || stderr) {
            goBinaryProcess.kill();
            goBinaryReject(error || new Error(stderr));
          }
        });

        if (goBinaryProcess.stdout)
          goBinaryProcess.stdout.on('data', (chunk) => {
            stdoutChunks.push(chunk.toString());
          });

        if (goBinaryProcess.stderr)
          goBinaryProcess.stderr.on('data', (chunk) => {
            goBinaryReject(new Error(chunk.toString()));
          });

        goBinaryProcess.on('error', (e) => goBinaryReject(e));
        goBinaryProcess.on('exit', (code, signal) => {
          if (!code) goBinaryResolve(stdoutChunks.join(''));
          else
            goBinaryReject(
              new Error(
                `${TWITTER_SCAPPER.binary_file_path} exited with code ${code}${
                  signal ? `/signal ${signal}` : ''
                } (statusID ${statusID})`
              )
            );
        });
      });
    })
    .then((readOutput) => JSON.parse(readOutput) as SocialPost)
    .then((parsedPost) => {
      if (!parsedPost.medias?.length || !parsedPost.author || !parsedPost.authorURL) return Promise.resolve(undefined);

      if (typeof parsedPost.caption === 'string')
        parsedPost.caption = parsedPost.caption
          .replace(/\s?(?:https?:\/\/)?t.co\/\w+$/gi, '')
          .replace(/\s+/gi, ' ')
          .trim();

      return Promise.resolve(parsedPost);
    });
}
