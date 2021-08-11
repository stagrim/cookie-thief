import * as sqlite from 'better-sqlite3';
import { homedir } from 'os';
import { getFirefoxCookie } from '../src';

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(`[Profile1]
Name=default
IsRelative=1
Path=Profiles/mjr310e7.default
Default=1

[Profile0]
Name=default-release
IsRelative=1
Path=Profiles/tfhz7h6q.default-release`),
}));

jest.mock('better-sqlite3', () =>
  jest.fn().mockReturnValue({
    prepare: jest.fn().mockReturnValue({
      get: jest.fn().mockReturnValue({ value: 'foo' }),
    }),
  }),
);

describe('firefox get cookie', () => {
  describe('macos', () => {
    let originalPlatform: any;

    beforeAll(() => {
      originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      });
    });

    afterAll(() => {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    it('should fetch cookie correctly', async () => {
      expect(await getFirefoxCookie('https://some.url', 'some-cookie')).toEqual(
        'foo',
      );
      expect(sqlite).toHaveBeenCalledWith(
        `${homedir()}/Library/Application Support/Firefox/Profiles/tfhz7h6q.default-release/cookies.sqlite`,
        { fileMustExist: true, readonly: true },
      );
    });
  });

  describe('linux', () => {
    let originalPlatform: any;

    beforeAll(() => {
      originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });
    });

    afterAll(() => {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    it('should fetch cookie correctly', async () => {
      expect(await getFirefoxCookie('https://some.url', 'some-cookie')).toEqual(
        'foo',
      );
      expect(sqlite).toHaveBeenCalledWith(
        `${homedir()}/.mozilla/firefox/Profiles/tfhz7h6q.default-release/cookies.sqlite`,
        { fileMustExist: true, readonly: true },
      );
    });
  });

  describe('windows', () => {
    let originalPlatform: any;
    let originalAppData: any;

    beforeAll(() => {
      originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
      originalAppData = process.env.APPDATA;
      process.env.APPDATA = 'C:/foo';
    });

    afterAll(() => {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
      process.env.APPDATA = originalAppData;
    });

    it('should fetch cookie correctly', async () => {
      expect(await getFirefoxCookie('https://some.url', 'some-cookie')).toEqual(
        'foo',
      );
      expect(sqlite).toHaveBeenCalledWith(
        `C:/foo/Mozilla/Firefox/Profiles/tfhz7h6q.default-release/cookies.sqlite`,
        { fileMustExist: true, readonly: true },
      );
    });
  });

  describe('unsupported OS', () => {
    let originalPlatform: any;

    beforeAll(() => {
      originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', {
        value: 'freebsd',
      });
    });

    afterAll(() => {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    it('should throw an error', async () => {
      await expect(
        getFirefoxCookie('https://someurl.com', 'some-cookie'),
      ).rejects.toThrow('Platform freebsd is not supported');
    });
  });
});
