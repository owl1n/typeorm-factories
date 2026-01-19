import { globSync } from "glob";
import * as path from "path";

export class FactoryProvider {
  loadFiles(filePattern: string[]): string[] {
    return filePattern
      .map((pattern) => globSync(path.join(process.cwd(), pattern)))
      .reduce((acc, filePath) => acc.concat(filePath), []);
  }

  importFiles(filePaths: string[]) {
    return filePaths.forEach(require);
  }
}
