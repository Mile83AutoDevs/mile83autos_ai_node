import dotenv from "dotenv";
import { OpenRouter } from "@openrouter/sdk";
import Mile83autos_LLM_Rules from "../rules/llm_rules.mjs";
dotenv.config();

//  define global variable
const llm_client = new OpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

const _llm_temp_memory = new Map();
const MAX_MEMORY_SIZE = 100;

export default class mile83_llm_functions {
  // function to check if ai server is online
  isAIServerOnline(req, res) {
    res.status(200).json({ msg: "Server::Online" });
  }

  //  function to get users input and instruction
  async runModel(req, res) {
    try {
      const { _userTempId, _input } = req.body;
      //  if user temporary id is not found create a new temp id ;
      if (!_llm_temp_memory.has(_userTempId)) {
        _llm_temp_memory.set(_userTempId, []);
      }
      const _getUserPerviousData = _llm_temp_memory.get(_userTempId);
      _getUserPerviousData.push({ role: "user", content: _input });
      if (_getUserPerviousData.length > MAX_MEMORY_SIZE) {
        _getUserPerviousData.shift();
      }
      const llm_response = await llm_client.chat.send({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content: Mile83autos_LLM_Rules.rules,
          },
          ..._getUserPerviousData,
        ],
      });

      if (llm_response.choices[0].message) {
        _getUserPerviousData.push({
          role: "system",
          content: llm_response.choices[0].message.content,
        });
      }
      res.status(200).json({ msg: llm_response.choices[0].message });
    } catch (err) {
      console.error("Something went wrong", err);
    }
  }
}
