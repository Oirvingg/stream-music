/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Nota: O proxy do Deezer foi movido para server.js (Node.js/Express)
// para evitar a necessidade de upgrade do plano Firebase para Blaze.
// Se preferir usar Cloud Functions no futuro, descomente o código abaixo
// e remova o middleware em server.js.

// const DEEZER_BASE_URL = "https://api.deezer.com";
//
// exports.deezerProxy = onRequest(async (req, res) => {
//   const targetPath = req.path.replace(/^\/api\/deezer/, "") || "/";
//   const query = new URLSearchParams(req.query).toString();
//   const url = `${DEEZER_BASE_URL}${targetPath}${query ? `?${query}` : ""}`;
//
//   try {
//     const deezerResponse = await fetch(url);
//     const data = await deezerResponse.json();
//     res.status(deezerResponse.status).json(data);
//   } catch (error) {
//     logger.error("Erro ao repassar requisição para o Deezer", error);
//     res.status(502).json({error: "Falha ao buscar dados do Deezer"});
//   }
// });
