"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const context = github.context;
            const defaultLogUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;
            const token = core.getInput('token', { required: true });
            const octokit = github.getOctokit(token);
            const ref = core.getInput('ref', { required: false }) || context.ref;
            const sha = core.getInput('sha', { required: false }) || context.sha;
            const logUrl = core.getInput('log_url', { required: false }) || defaultLogUrl;
            const environmentUrl = core.getInput('environment_url', { required: false }) || '';
            const task = core.getInput('task', {
                required: false
            });
            const payload = core.getInput('payload', {
                required: false
            });
            const transientEnvironment = core.getInput('transient_environment', {
                required: false
            });
            const productionEnvironment = core.getInput('production_environment', {
                required: false
            });
            const environment = core.getInput('environment', { required: false }) || 'production';
            const description = core.getInput('description', { required: false });
            const initialStatus = core.getInput('initial_status', {
                required: false
            }) || 'pending';
            const autoMerge = core.getInput('auto_merge', {
                required: false
            });
            const requiredContexts = core.getInput('required_contexts', {
                required: false
            });
            const deployment = yield octokit.rest.repos.createDeployment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                ref,
                sha,
                task,
                required_contexts: requiredContexts ? requiredContexts.split(',') : [],
                environment,
                transient_environment: transientEnvironment === 'true',
                production_environment: productionEnvironment === 'true',
                auto_merge: autoMerge === 'true',
                payload: payload ? tryParseJSON(payload) : undefined,
                description
            });
            if (!('id' in deployment.data)) {
                // TODO: Should 202 be handled differently? Either way we get no ID
                throw new Error(deployment.data.message);
            }
            yield octokit.rest.repos.createDeploymentStatus(Object.assign(Object.assign({}, context.repo), { deployment_id: deployment.data.id, state: initialStatus, log_url: logUrl, environment_url: environmentUrl }));
            core.setOutput('deployment_id', deployment.data.id.toString());
        }
        catch (error) {
            core.error(error);
            core.setFailed(error.message);
        }
    });
}
/**
 * helper function to try and parse a provided input string as a JSON object.
 * If it cannot be parsed the input string is returned.
 */
function tryParseJSON(str) {
    let res = str;
    try {
        res = JSON.parse(str);
    }
    catch (e) {
        core.info(`couldn't parse string as JSON: ${str}`);
    }
    return res;
}
run();
