import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { ToolName } from "../types";

const SYSTEM_PROMPT = `
Você é JARVIS, um assistente pessoal inteligente projetado para uso em aplicativo mobile, especializado exclusivamente em criação e gerenciamento de alarmes e tarefas.
Responda sempre em português (Brasil).

🎯 Missão
Ajudar o usuário a organizar seu dia e semana, criando, listando, editando e removendo:
⏰ Alarmes
✅ Tarefas

⏰ Regras de Alarmes
- Identifique data, hora e descrição.
- Se faltar algo, pergunte.
- Horários informais: manhã (08:00), tarde (14:00), noite (19:00).

✅ Regras de Tarefas
- Identifique título, prazo e horário.
- Se não houver data, marque como "sem data".

🧠 Regras de Comportamento
- Nunca assumir informações não fornecidas.
- Fazer perguntas curtas e objetivas.
- Tom de Voz: Claro, Educado, Profissional, Amigável sem exageros.
- Nome: JARVIS.
`;

// Tool Definitions
const addAlarmTool: FunctionDeclaration = {
  name: ToolName.ADD_ALARM,
  description: "Cria um novo alarme.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      time: { type: Type.STRING, description: "Horário do alarme (formato HH:mm ou ISO)" },
      description: { type: Type.STRING, description: "Descrição do alarme" },
    },
    required: ["time", "description"],
  },
};

const listAlarmsTool: FunctionDeclaration = {
  name: ToolName.LIST_ALARMS,
  description: "Lista todos os alarmes configurados.",
  parameters: { type: Type.OBJECT, properties: {} },
};

const deleteAlarmTool: FunctionDeclaration = {
  name: ToolName.DELETE_ALARM,
  description: "Remove um alarme existente pelo ID ou descrição.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      keyword: { type: Type.STRING, description: "ID ou palavra-chave para identificar o alarme a ser removido" },
    },
    required: ["keyword"],
  },
};

const addTaskTool: FunctionDeclaration = {
  name: ToolName.ADD_TASK,
  description: "Adiciona uma nova tarefa.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Título ou descrição da tarefa" },
      date: { type: Type.STRING, description: "Data da tarefa (YYYY-MM-DD ou 'hoje', 'amanhã')" },
      time: { type: Type.STRING, description: "Horário opcional da tarefa" },
    },
    required: ["title"],
  },
};

const listTasksTool: FunctionDeclaration = {
  name: ToolName.LIST_TASKS,
  description: "Lista as tarefas existentes.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filter: { type: Type.STRING, description: "Filtro opcional: 'hoje', 'semana', 'todas'" },
    },
  },
};

const completeTaskTool: FunctionDeclaration = {
  name: ToolName.COMPLETE_TASK,
  description: "Marca uma tarefa como concluída.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      keyword: { type: Type.STRING, description: "ID ou palavra-chave para identificar a tarefa" },
    },
    required: ["keyword"],
  },
};

const deleteTaskTool: FunctionDeclaration = {
  name: ToolName.DELETE_TASK,
  description: "Remove uma tarefa da lista.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      keyword: { type: Type.STRING, description: "ID ou palavra-chave para identificar a tarefa" },
    },
    required: ["keyword"],
  },
};

const tools: Tool[] = [{
  functionDeclarations: [
    addAlarmTool,
    listAlarmsTool,
    deleteAlarmTool,
    addTaskTool,
    listTasksTool,
    completeTaskTool,
    deleteTaskTool
  ]
}];

let ai: GoogleGenAI | null = null;

export const initializeGemini = () => {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

export const createChatSession = () => {
  if (!ai) initializeGemini();
  if (!ai) throw new Error("API Key not found");

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: tools,
    },
  });
};
