#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
const server = new Server({
    name: "qube-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_system_info",
                description: "Get current system information",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "echo",
                description: "Echo back a message",
                inputSchema: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            description: "Message to echo",
                        },
                        uppercase: {
                            type: "boolean",
                            description: "Convert to uppercase",
                            default: false,
                        },
                    },
                    required: ["message"],
                },
            },
            {
                name: "calculate",
                description: "Perform basic arithmetic",
                inputSchema: {
                    type: "object",
                    properties: {
                        operation: {
                            type: "string",
                            enum: ["add", "subtract", "multiply", "divide"],
                        },
                        a: { type: "number" },
                        b: { type: "number" },
                    },
                    required: ["operation", "a", "b"],
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "get_system_info": {
                const info = {
                    timestamp: new Date().toISOString(),
                    platform: process.platform,
                    nodeVersion: process.version,
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
                };
            }
            case "echo": {
                const message = args?.message;
                const uppercase = args?.uppercase;
                const result = uppercase ? message.toUpperCase() : message;
                return {
                    content: [{ type: "text", text: `Echo: ${result}` }],
                };
            }
            case "calculate": {
                const op = args?.operation;
                const a = args?.a;
                const b = args?.b;
                let result;
                switch (op) {
                    case "add":
                        result = a + b;
                        break;
                    case "subtract":
                        result = a - b;
                        break;
                    case "multiply":
                        result = a * b;
                        break;
                    case "divide":
                        if (b === 0)
                            throw new Error("Division by zero");
                        result = a / b;
                        break;
                    default:
                        throw new Error(`Unknown operation: ${op}`);
                }
                return {
                    content: [{ type: "text", text: `Result: ${result}` }],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`
                }],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server running");
}
main().catch(console.error);
