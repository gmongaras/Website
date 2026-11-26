#!/usr/bin/env python3

from pathlib import Path
import shutil
import subprocess
import sys


def main():
    node = shutil.which('node')
    if not node:
        print('Node.js was not found on PATH.', file=sys.stderr)
        return 127

    script = Path(__file__).with_name('add_paper.js')
    result = subprocess.run([node, str(script), *sys.argv[1:]], check=False)
    return result.returncode


if __name__ == '__main__':
    raise SystemExit(main())