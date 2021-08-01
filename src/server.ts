import express, { NextFunction } from 'express';
import bodyParser from 'body-parser';
import { filterImageFromURL, deleteLocalFiles } from './util/util';
import 'express-async-errors';
import { error } from 'console';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;

  // Use the body parser middleware for post requests
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      console.log(`Received request: ${req.method} ${req.url}`)
      next()
    } catch (err) {
      next(error)
    }
  })

  app.use(bodyParser.json());

  // GET image_url={{URL}}
  app.get("/filteredimage", async (req: express.Request, res: express.Response) => {
    const imageUrl = req.query.image_url || ""

    if (!isURL(imageUrl)) {
      res.status(400).send({ error: "`image_url` is not a valid url" })
      return
    }

    const out = await filterImageFromURL(imageUrl)
    res.sendFile(
      out,
      async (err: any) => {
        if (err) { console.log(err) }
        try {
          await deleteLocalFiles([out])
        } catch (err) {
          console.error("failed to cleanup files")
        }

      }
    )
  })


  app.get("/", async (req: express.Request, res: express.Response) => {
    res.send("try GET /filteredimage?image_url={{}}")
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err)
    res.status(err.status || 500).send({ "error": "An error has occurred" })
  })

  // Start the Server
  app.listen(port, () => {
    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });
})();

function isURL(str: string) {
  var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
  var url = new RegExp(urlRegex, 'i');
  return str.length < 2083 && url.test(str);
}