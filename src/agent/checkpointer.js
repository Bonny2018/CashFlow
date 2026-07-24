/**
 * LangGraph Persistent Database State Checkpointer
 * Implements a checkpointer interface for LangGraph state saving into Supabase / DB.
 */
import { BaseCheckpointSaver } from '@langchain/langgraph';
import { saveLangGraphCheckpoint, getLangGraphCheckpoint } from './dbService.js';

export class SupabaseLangGraphCheckpointer extends BaseCheckpointSaver {
  constructor() {
    super();
  }

  async getTuple(config) {
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns || '';
    const checkpointId = config.configurable?.checkpoint_id;

    if (!threadId) return undefined;

    if (checkpointId) {
      const checkpoint = await getLangGraphCheckpoint(threadId, checkpointNs, checkpointId);
      if (checkpoint) {
        return {
          config,
          checkpoint,
          metadata: {}
        };
      }
    }

    return undefined;
  }

  async list(config, options) {
    // Basic listing support
    return [];
  }

  async put(config, checkpoint, metadata) {
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns || '';
    const checkpointId = checkpoint.id;

    if (threadId && checkpointId) {
      await saveLangGraphCheckpoint(
        threadId,
        checkpointNs,
        checkpointId,
        checkpoint,
        config.configurable?.parent_checkpoint_id || null,
        metadata
      );
    }

    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpointId
      }
    };
  }

  async putWrites(config, writes, taskId) {
    // Optional writes implementation
    return;
  }
}

export const dbCheckpointer = new SupabaseLangGraphCheckpointer();
