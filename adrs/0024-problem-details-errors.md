# 24. API errors as RFC 9457 Problem Details

- Status: Accepted
- Date: 2026-10-07

## Context

The API answered errors in NestJS's default shape, `{ statusCode, message, error }`, where `message` is a string or a list of sentences ("title should not be empty"). AI agents use the API through the MCP server (ADR-0019) and directly: they had to parse English sentences to find which field was wrong, had no stable identifier for the kind of error, and weren't told how to fix the request (accepted values, valid ids). Body-parser errors and unknown routes used the same shape.

RFC 9457, "Problem Details for HTTP APIs" (2023, obsoletes RFC 7807), is the standard for this: an `application/problem+json` body with `type`, `title`, `status`, `detail` and `instance`, plus extension members.

## Decision

- **Every error** is a Problem Details body with `Content-Type: application/problem+json`, produced by one global exception filter (`back/src/problems/problem.filter.ts`, registered as `APP_FILTER` with the validation pipe in `ProblemsModule`).
- **`type`** names the kind of problem: `/problems/<kind>`, a URI relative to the API, stable so clients compare it as is. `GET /problems/<kind>` describes it (`title`, `status`, and a `description` of when it happens and how to fix the request); `GET /problems` lists them. RFC 9457 recommends absolute URIs, but the API's origin is runtime configuration; a relative reference resolves against the API it came from. Kinds: `validation-error`, `malformed-request`, `resource-not-found`, `route-not-found`, `service-unavailable`, `internal-error`; a plain HTTP error the API doesn't classify uses `about:blank` with the status phrase as `title`, as the RFC defines. `ProblemType` is a union in `@emploi/shared` with a `Record` per package.
- **`detail`** says what happened this time and what to do (e.g. which endpoint lists valid ids). Written in English for developers and agents; the front never shows it (ADR-0016).
- **`validation-error`** lists every invalid value in `errors`: `in` (`body`, `query`, `path`), `name` (a JSON Pointer, RFC 6901, into the body such as `/title`, or the parameter name), `code` (the class-validator rule, stable: `isNotEmpty`, `maxLength`, `isIn`, `whitelistValidation`…, or our own, e.g. `everyStepOnce`), `detail`, and hints when they help: `allowed` for `isIn`, `maxLength`. The location comes from a `ValidationPipe` subclass that knows which argument it validates, and `ParseIdPipe` replaces `ParseUUIDPipe` to name invalid path ids. This follows the RFC's own example of an `errors` extension with JSON Pointers.
- **`resource-not-found`** carries `resource` (`offer` or `interview-step`).
- **Unexpected errors** become `internal-error`, logged on the server, with nothing from the original error in the body.
- The OpenAPI document describes the `ProblemDetailsDto` schema on every error response, with examples built by the functions that raise the errors; a test checks every error response uses it.
- Clients: the front's and the MCP's `ApiError` carry the parsed `problem` (or `null` when the response isn't one, e.g. a proxy page). The front decides with `isProblem(error, kind)` instead of status codes. The MCP server gives the model a summary, one line per invalid value with the accepted values, then the Problem Details as JSON.

## Consequences

- Agents and other clients can rely on `type` and `errors[].code` and fix requests without reading sentences; humans get the same information in Swagger UI and at `/problems/<kind>`.
- Breaking change of the error shape for any client reading `message`: only the front and the MCP server, both updated.
- A new kind of problem means a value in `ProblemType`, its description in `problem-types.ts`, and the type-checked records in the clients.
- class-validator rule names become part of the contract (`errors[].code`); a rule changed on a field changes its code.
