import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import * as Interfaces from "./types/types";
import * as tempMockFunctions from "./functions/tempMock.ts";

const app: express.Express = express();
const client: MongoClient = new MongoClient();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("port", 3000);

app.listen(app.get("port"), async () => {
    console.info(`Express listening to 'http://localhost:${app.get("port")}'`);
});