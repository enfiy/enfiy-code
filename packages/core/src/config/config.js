/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import * as path from 'node:path';
import process from 'node:process';
import { createContentGeneratorConfig, } from '../core/contentGenerator.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import { LSTool } from '../tools/ls.js';
import { ReadFileTool } from '../tools/read-file.js';
import { GrepTool } from '../tools/grep.js';
import { GlobTool } from '../tools/glob.js';
import { EditTool } from '../tools/edit.js';
import { ShellTool } from '../tools/shell.js';
import { WriteFileTool } from '../tools/write-file.js';
import { WebFetchTool } from '../tools/web-fetch.js';
import { ReadManyFilesTool } from '../tools/read-many-files.js';
import { MemoryTool, setEnfiyMdFilename } from '../tools/memoryTool.js';
import { WebSearchTool } from '../tools/web-search.js';
import { EnfiyClient } from '../core/client.js';
import { ENFIY_CONFIG_DIR as ENFIY_DIR } from '../tools/memoryTool.js';
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import { GitService } from '../services/gitService.js';
import { getProjectTempDir } from '../utils/paths.js';
import { initializeTelemetry, DEFAULT_TELEMETRY_TARGET, DEFAULT_OTLP_ENDPOINT, StartSessionEvent, } from '../telemetry/index.js';
import { DEFAULT_ENFIY_EMBEDDING_MODEL, DEFAULT_ENFIY_FLASH_MODEL, } from './models.js';
import { ClearcutLogger } from '../telemetry/clearcut-logger/clearcut-logger.js';
export let ApprovalMode;
(function (ApprovalMode) {
    ApprovalMode["DEFAULT"] = "default";
    ApprovalMode["AUTO_EDIT"] = "autoEdit";
    ApprovalMode["YOLO"] = "yolo";
})(ApprovalMode || (ApprovalMode = {}));
export class MCPServerConfig {
    command;
    args;
    env;
    cwd;
    url;
    httpUrl;
    tcp;
    timeout;
    trust;
    description;
    constructor(
    // For stdio transport
    command, args, env, cwd, 
    // For sse transport
    url, 
    // For streamable http transport
    httpUrl, 
    // For websocket transport
    tcp, 
    // Common
    timeout, trust, 
    // Metadata
    description) {
        this.command = command;
        this.args = args;
        this.env = env;
        this.cwd = cwd;
        this.url = url;
        this.httpUrl = httpUrl;
        this.tcp = tcp;
        this.timeout = timeout;
        this.trust = trust;
        this.description = description;
    }
}
export class Config {
    toolRegistry;
    sessionId;
    contentGeneratorConfig;
    embeddingModel;
    sandbox;
    targetDir;
    debugMode;
    question;
    fullContext;
    coreTools;
    excludeTools;
    toolDiscoveryCommand;
    toolCallCommand;
    mcpServerCommand;
    mcpServers;
    userMemory;
    enfiyMdFileCount;
    approvalMode;
    showMemoryUsage;
    accessibility;
    telemetrySettings;
    usageStatisticsEnabled;
    enfiyClient;
    fileFiltering;
    fileDiscoveryService = null;
    gitService = undefined;
    checkpointing;
    proxy;
    cwd;
    bugCommand;
    model;
    extensionContextFilePaths;
    modelSwitchedDuringSession = false;
    flashFallbackHandler;
    constructor(params) {
        this.sessionId = params.sessionId;
        this.embeddingModel =
            params.embeddingModel ?? DEFAULT_ENFIY_EMBEDDING_MODEL;
        this.sandbox = params.sandbox;
        this.targetDir = path.resolve(params.targetDir);
        this.debugMode = params.debugMode;
        this.question = params.question;
        this.fullContext = params.fullContext ?? false;
        this.coreTools = params.coreTools;
        this.excludeTools = params.excludeTools;
        this.toolDiscoveryCommand = params.toolDiscoveryCommand;
        this.toolCallCommand = params.toolCallCommand;
        this.mcpServerCommand = params.mcpServerCommand;
        this.mcpServers = params.mcpServers;
        this.userMemory = params.userMemory ?? '';
        this.enfiyMdFileCount = params.enfiyMdFileCount ?? 0;
        this.approvalMode = params.approvalMode ?? ApprovalMode.DEFAULT;
        this.showMemoryUsage = params.showMemoryUsage ?? false;
        this.accessibility = params.accessibility ?? {};
        this.telemetrySettings = {
            enabled: params.telemetry?.enabled ?? false,
            target: params.telemetry?.target ?? DEFAULT_TELEMETRY_TARGET,
            otlpEndpoint: params.telemetry?.otlpEndpoint ?? DEFAULT_OTLP_ENDPOINT,
            logPrompts: params.telemetry?.logPrompts ?? true,
        };
        this.usageStatisticsEnabled = params.usageStatisticsEnabled ?? true;
        this.fileFiltering = {
            respectGitIgnore: params.fileFiltering?.respectGitIgnore ?? true,
            enableRecursiveFileSearch: params.fileFiltering?.enableRecursiveFileSearch ?? true,
        };
        this.checkpointing = params.checkpointing ?? false;
        this.proxy = params.proxy;
        this.cwd = params.cwd ?? process.cwd();
        this.fileDiscoveryService = params.fileDiscoveryService ?? null;
        this.bugCommand = params.bugCommand;
        this.model = params.model;
        this.extensionContextFilePaths = params.extensionContextFilePaths ?? [];
        if (params.contextFileName) {
            setEnfiyMdFilename(params.contextFileName);
        }
        if (this.telemetrySettings.enabled) {
            initializeTelemetry(this);
        }
        if (this.getUsageStatisticsEnabled()) {
            ClearcutLogger.getInstance(this)?.logStartSessionEvent(new StartSessionEvent(this));
        }
        else {
            console.log('Data collection is disabled.');
        }
    }
    async refreshAuth(authMethod) {
        // Always use the original default model when switching auth methods
        // This ensures users don't stay on Flash after switching between auth types
        // and allows API key users to get proper fallback behavior from getEffectiveModel
        const modelToUse = this.model; // Use the original default model
        // Temporarily clear contentGeneratorConfig to prevent getModel() from returning
        // the previous session's model (which might be Flash)
        this.contentGeneratorConfig = undefined;
        const contentConfig = await createContentGeneratorConfig(modelToUse, authMethod, this);
        const ec = new EnfiyClient(this);
        this.enfiyClient = ec;
        this.toolRegistry = await createToolRegistry(this);
        await ec.initialize(contentConfig);
        this.contentGeneratorConfig = contentConfig;
        // Reset the session flag since we're explicitly changing auth and using default model
        this.modelSwitchedDuringSession = false;
        // Note: In the future, we may want to reset any cached state when switching auth methods
    }
    getSessionId() {
        return this.sessionId;
    }
    getContentGeneratorConfig() {
        return this.contentGeneratorConfig;
    }
    getModel() {
        return this.contentGeneratorConfig?.model || this.model;
    }
    setModel(newModel) {
        if (this.contentGeneratorConfig) {
            this.contentGeneratorConfig.model = newModel;
            this.modelSwitchedDuringSession = true;
        }
    }
    isModelSwitchedDuringSession() {
        return this.modelSwitchedDuringSession;
    }
    resetModelToDefault() {
        if (this.contentGeneratorConfig) {
            this.contentGeneratorConfig.model = this.model; // Reset to the original default model
            this.modelSwitchedDuringSession = false;
        }
    }
    setFlashFallbackHandler(handler) {
        this.flashFallbackHandler = handler;
    }
    getEmbeddingModel() {
        return this.embeddingModel;
    }
    getSandbox() {
        return this.sandbox;
    }
    getTargetDir() {
        return this.targetDir;
    }
    getProjectRoot() {
        return this.targetDir;
    }
    getToolRegistry() {
        return Promise.resolve(this.toolRegistry);
    }
    getDebugMode() {
        return this.debugMode;
    }
    getQuestion() {
        return this.question;
    }
    getFullContext() {
        return this.fullContext;
    }
    getCoreTools() {
        return this.coreTools;
    }
    getExcludeTools() {
        return this.excludeTools;
    }
    getToolDiscoveryCommand() {
        return this.toolDiscoveryCommand;
    }
    getToolCallCommand() {
        return this.toolCallCommand;
    }
    getMcpServerCommand() {
        return this.mcpServerCommand;
    }
    getMcpServers() {
        return this.mcpServers;
    }
    getUserMemory() {
        return this.userMemory;
    }
    setUserMemory(newUserMemory) {
        this.userMemory = newUserMemory;
    }
    getEnfiyMdFileCount() {
        return this.enfiyMdFileCount;
    }
    setEnfiyMdFileCount(count) {
        this.enfiyMdFileCount = count;
    }
    getApprovalMode() {
        return this.approvalMode;
    }
    setApprovalMode(mode) {
        this.approvalMode = mode;
    }
    getShowMemoryUsage() {
        return this.showMemoryUsage;
    }
    getAccessibility() {
        return this.accessibility;
    }
    getTelemetryEnabled() {
        return this.telemetrySettings.enabled ?? false;
    }
    getTelemetryLogPromptsEnabled() {
        return this.telemetrySettings.logPrompts ?? true;
    }
    getTelemetryOtlpEndpoint() {
        return this.telemetrySettings.otlpEndpoint ?? DEFAULT_OTLP_ENDPOINT;
    }
    getTelemetryTarget() {
        return this.telemetrySettings.target ?? DEFAULT_TELEMETRY_TARGET;
    }
    getEnfiyClient() {
        return this.enfiyClient;
    }
    async reinitializeEnfiyClient() {
        // Reinitialize EnfiyClient with current config
        const ec = new EnfiyClient(this);
        this.enfiyClient = ec;
        await ec.initialize(this.contentGeneratorConfig);
    }
    getEnfiyDir() {
        return path.join(this.targetDir, ENFIY_DIR);
    }
    getProjectTempDir() {
        return getProjectTempDir(this.getProjectRoot());
    }
    getEnableRecursiveFileSearch() {
        return this.fileFiltering.enableRecursiveFileSearch;
    }
    getFileFilteringRespectGitIgnore() {
        return this.fileFiltering.respectGitIgnore;
    }
    getCheckpointingEnabled() {
        return this.checkpointing;
    }
    getProxy() {
        return this.proxy;
    }
    getWorkingDir() {
        return this.cwd;
    }
    getBugCommand() {
        return this.bugCommand;
    }
    getFileService() {
        if (!this.fileDiscoveryService) {
            this.fileDiscoveryService = new FileDiscoveryService(this.targetDir);
        }
        return this.fileDiscoveryService;
    }
    getUsageStatisticsEnabled() {
        return this.usageStatisticsEnabled;
    }
    getExtensionContextFilePaths() {
        return this.extensionContextFilePaths;
    }
    async getGitService() {
        if (!this.gitService) {
            this.gitService = new GitService(this.targetDir);
            await this.gitService.initialize();
        }
        return this.gitService;
    }
}
export function createToolRegistry(config) {
    const registry = new ToolRegistry(config);
    const targetDir = config.getTargetDir();
    const tools = config.getCoreTools()
        ? new Set(config.getCoreTools())
        : undefined;
    const excludeTools = config.getExcludeTools()
        ? new Set(config.getExcludeTools())
        : undefined;
    // helper to create & register core tools that are enabled
     
    const registerCoreTool = (ToolClass, ...args) => {
        // check both the tool name (.Name) and the class name (.name)
        if (
        // coreTools contain tool name
        (!tools || tools.has(ToolClass.Name) || tools.has(ToolClass.name)) &&
            // excludeTools don't contain tool name
            (!excludeTools ||
                (!excludeTools.has(ToolClass.Name) &&
                    !excludeTools.has(ToolClass.name)))) {
            registry.registerTool(new ToolClass(...args));
        }
    };
    registerCoreTool(LSTool, targetDir, config);
    registerCoreTool(ReadFileTool, targetDir, config);
    registerCoreTool(GrepTool, targetDir);
    registerCoreTool(GlobTool, targetDir, config);
    registerCoreTool(EditTool, config);
    registerCoreTool(WriteFileTool, config);
    registerCoreTool(WebFetchTool, config);
    registerCoreTool(ReadManyFilesTool, targetDir, config);
    registerCoreTool(ShellTool, config);
    registerCoreTool(MemoryTool);
    registerCoreTool(WebSearchTool, config);
    return (async () => {
        await registry.discoverTools();
        return registry;
    })();
}
// Export model constants for use in CLI
export { DEFAULT_ENFIY_FLASH_MODEL };
//# sourceMappingURL=config.js.map