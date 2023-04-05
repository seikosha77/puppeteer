/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'assert';
import {execSync} from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  computeExecutablePath,
  launch,
  fetch,
  Browser,
  BrowserPlatform,
  Cache,
  createProfile,
} from '../../../lib/cjs/main.js';
import {testFirefoxBuildId} from '../versions.js';

describe('Firefox', () => {
  it('should compute executable path for Firefox', () => {
    assert.strictEqual(
      computeExecutablePath({
        browser: Browser.FIREFOX,
        platform: BrowserPlatform.LINUX,
        buildId: '123',
        cacheDir: 'cache',
      }),
      path.join('cache', 'firefox', 'linux-123', 'firefox', 'firefox')
    );
  });

  describe('launcher', function () {
    this.timeout(60000);

    let tmpDir = '/tmp/puppeteer-browsers-test';

    beforeEach(async () => {
      tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'puppeteer-browsers-test')
      );
      await fetch({
        cacheDir: tmpDir,
        browser: Browser.FIREFOX,
        buildId: testFirefoxBuildId,
      });
    });

    afterEach(() => {
      try {
        new Cache(tmpDir).clear();
      } catch (err) {
        if (os.platform() === 'win32') {
          console.log(execSync('tasklist').toString('utf-8'));
        }
        throw err;
      }
    });

    it('should launch a Firefox browser', async () => {
      const userDataDir = path.join(tmpDir, 'profile');
      function getArgs(): string[] {
        const firefoxArguments = ['--no-remote'];
        switch (os.platform()) {
          case 'darwin':
            firefoxArguments.push('--foreground');
            break;
          case 'win32':
            firefoxArguments.push('--wait-for-browser');
            break;
        }
        firefoxArguments.push('--profile', userDataDir);
        firefoxArguments.push('--headless');
        firefoxArguments.push('about:blank');
        return firefoxArguments;
      }
      await createProfile(Browser.FIREFOX, {
        path: userDataDir,
        preferences: {},
      });
      const executablePath = computeExecutablePath({
        cacheDir: tmpDir,
        browser: Browser.FIREFOX,
        buildId: testFirefoxBuildId,
      });
      const process = launch({
        executablePath,
        args: getArgs(),
      });
      await process.close();
    });
  });
});