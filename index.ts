import { writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { Database } from "sqlite3";
import { open } from "sqlite";

export interface Article {
  id: string;
  title: string;
  content: string;
  extension: "txt" | "md";
  updateTime: number;
  createTime: number;
  folderId: string;
  categoryId?: string;
  rank: number;
  editorId: number;
}

export interface Folder {
  id?: string;
  name: string;
  description?: string;
}

const INPUT = resolve(__dirname, "backups");
const OUTPUT = resolve(__dirname, "output");

const getFolderId = (folders: Folder[], article: Article): Folder => {
  const folder = folders.find((it) => it.id === article.folderId);
  return folder ?? { name: "Untitled" };
};

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

  const articles = await db.all<Article[]>(`SELECT * FROM Article`);
  const folders = await db.all<Folder[]>(`SELECT * FROM Folder`);

  const saveArticle = (article: Article) => {
    const { title, content, extension } = article;
    const folder = getFolderId(folders, article);
    const { name: folderName } = folder;
    const pathToSave = resolve(OUTPUT, folderName);
    const safeTitle = title === "" ? "Untitled" : escape(title);
    const fileToSave = resolve(pathToSave, `${safeTitle}.${extension}`);
    if (!existsSync(pathToSave)) {
      mkdirSync(pathToSave);
    }
    writeFileSync(fileToSave, content);
  };
  articles.forEach(saveArticle);
})();
