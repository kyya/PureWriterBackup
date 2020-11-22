import { writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { Database } from "sqlite3";
import { open } from "sqlite";

export interface Article {
  id: string;
  title: string;
  content: string;
  extension: "txt" | "md";
  folderId: string;
}

export interface Folder {
  id?: string;
  name: string;
  description?: string;
}

export interface Articled extends Article {
  folderName: string;
}

const INPUT = resolve(__dirname, "backups");
const OUTPUT = resolve(__dirname, "output");

function findOneFile(path: string, extension: RegExp) {
  if (!existsSync(path)) {
    console.error("[ERROR] > INPUT Folder Not Found: ", path);
    return;
  }

  const files = readdirSync(path);
  for (var i = 0; i < files.length; i++) {
    const filename = join(path, files[i]);
    if (extension.test(filename)) {
      return filename;
    }
  }
}

const escape = (title: string) => title.replace(/\?/, "");

(async () => {
  const DB_NAME = findOneFile(INPUT, /\.db/);

  if (!DB_NAME) {
    console.error("[ERROR] > DB Not Found!");
    return;
  }

  if (!existsSync(OUTPUT)) {
    mkdirSync(OUTPUT);
  }

  const db = await open({
    filename: resolve(INPUT, DB_NAME),
    driver: Database,
  });

  const articles = await db.all<Articled[]>(
    `SELECT Article.title, Article.content, Article.extension, Folder.name as folderName FROM Article, Folder WHERE Article.folderId=Folder.id`
  );
  console.log(articles);

  const saveArticle = (article: Articled) => {
    const { title, content, extension, folderName } = article;
    const pathToSave = resolve(OUTPUT, folderName);

    if (!existsSync(pathToSave)) {
      mkdirSync(pathToSave);
    }

    const safeTitle = title === "" ? "Untitled" : escape(title);
    const fileToSave = resolve(pathToSave, `${safeTitle}.${extension}`);
    writeFileSync(fileToSave, content);
  };
  articles.forEach(saveArticle);
})();
