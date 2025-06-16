{
  description = "Circle of Fifths visualizer";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; config.allowUnfree = true; };
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_24 
            pnpm
            git
            vscode
          ];

          shellHook = ''
            export NODE_OPTIONS=--max_old_space_size=4096
            echo "✅ DevShell ready. Use 'pnpm install' to set up dependencies."
          '';
        };
      });
}

