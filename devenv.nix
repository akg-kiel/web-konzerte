{ config, lib, pkgs, ... }:

let
  # The existing CDP checks use Chromium directly, without a Playwright npm dependency.
  chromium = pkgs.playwright-driver.components.chromium;
  chromiumExecutable = {
    aarch64-linux = "chrome-linux/chrome";
    x86_64-linux = "chrome-linux64/chrome";
    aarch64-darwin = "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
    x86_64-darwin = "chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
  }.${pkgs.stdenv.hostPlatform.system};
in
{
  packages = [
    pkgs.bash
    pkgs.coreutils
    pkgs.git
  ];

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_22;
    lsp.enable = false;
    pnpm = {
      enable = true;
      package = pkgs.pnpm_11.override {
        nodejs-slim = config.languages.javascript.package;
      };
    };
  };

  env = {
    CHROME_BIN = "${chromium}/${chromiumExecutable}";
    FONTCONFIG_FILE = pkgs.makeFontsConf {
      fontDirectories = [ pkgs.dejavu_fonts ];
    };
  } // lib.optionalAttrs pkgs.stdenv.isLinux {
    # Keep workerd from the pnpm lockfile; use Nix's loader without patching pnpm's store.
    MINIFLARE_WORKERD_PATH = "${pkgs.writeShellScript "workerd-nix" ''
      set -euo pipefail
      binary="$(${lib.getExe config.languages.javascript.package} -e '
        const { createRequire } = require("node:module");
        const project = createRequire(process.env.DEVENV_ROOT + "/package.json");
        const wrangler = createRequire(project.resolve("wrangler"));
        const miniflare = createRequire(wrangler.resolve("miniflare"));
        process.stdout.write(miniflare("workerd").default);
      ')"
      exec ${pkgs.stdenv.cc.bintools.dynamicLinker} \
        --library-path ${lib.makeLibraryPath [ pkgs.glibc pkgs.stdenv.cc.cc.lib ]} "$binary" "$@"
    ''}";
  };

  tasks = {
    "project:setup" = {
      description = "Install dependencies from the frozen lockfile";
      exec = "pnpm install --frozen-lockfile";
    };
    "project:check" = {
      description = "Run tests, formatting, lint and framework type checks";
      after = [ "project:setup" ];
      exec = "pnpm exec vp run check";
    };
    "project:build" = {
      description = "Build the application";
      after = [ "project:setup" ];
      exec = "pnpm exec vp run build";
    };
    "project:quality" = {
      description = "Run the portable quality and build gate";
      after = [ "project:setup" ];
      before = [ "devenv:enterTest" ];
      exec = "pnpm exec vp run quality";
    };
  };

  # Keep development servers out of the build/preview test lifecycle.
  processes = lib.optionalAttrs (!config.devenv.isTesting) {
    web = {
      after = [ "project:setup" ];
      ports.http.allocate = 4321;
      exec = "pnpm exec vp run dev --host 127.0.0.1 --port ${toString config.processes.web.ports.http.value}";
    };
  };

  enterTest = ''
    "$CHROME_BIN" --version
  '';
}
