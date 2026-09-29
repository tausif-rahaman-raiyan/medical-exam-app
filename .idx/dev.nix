{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
    pkgs.python3
  ];
  idx = {
    previews = {
      enable = true;
      previews = {
        web = {
          # This tells IDX to run a simple web server inside your www folder
          command = ["python3" "-m" "http.server" "$PORT" "--directory" "www"];
          manager = "web";
        };
      };
    };
  };
}