"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRoutes = RegisterRoutes;
const runtime_1 = require("@tsoa/runtime");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const GetLinksController_1 = require("./../controllers/GetLinksController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const models = {
    "GetLinksResponse": {
        "dataType": "refObject",
        "properties": {
            "spotifyUrl": { "dataType": "string", "required": true },
            "appleMusicUrl": { "dataType": "string" },
            "deezerUrl": { "dataType": "string" },
            "tidalUrl": { "dataType": "string" },
            "imageUrl": { "dataType": "string", "required": true },
            "albumName": { "dataType": "string", "required": true },
            "artistName": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ErrorResponse": {
        "dataType": "refObject",
        "properties": {
            "message": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new runtime_1.ExpressTemplateService(models, { "noImplicitAdditionalProperties": "throw-on-extras", "bodyCoercion": true });
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
function RegisterRoutes(app) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
    const argsGetLinksController_getAlbum = {
        spotifyUrl: { "in": "query", "name": "spotifyUrl", "required": true, "dataType": "string" },
        badRequestResponse: { "in": "res", "name": "400", "required": true, "ref": "ErrorResponse" },
        serverErrorResponse: { "in": "res", "name": "500", "required": true, "ref": "ErrorResponse" },
    };
    app.get('/get_links', ...((0, runtime_1.fetchMiddlewares)(GetLinksController_1.GetLinksController)), ...((0, runtime_1.fetchMiddlewares)(GetLinksController_1.GetLinksController.prototype.getAlbum)), async function GetLinksController_getAlbum(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsGetLinksController_getAlbum, request, response });
            const controller = new GetLinksController_1.GetLinksController();
            await templateService.apiHandler({
                methodName: 'getAlbum',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
