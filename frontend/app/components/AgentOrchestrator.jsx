'use client'
import { useState, useEffect, useCallback } from 'react'

// GOUV4 Agent Registry - Module 3 Console Multi-Agent
const AGENT_REGISTRY = {
  merlin: {
    name: 'MERLIN',
    role: 'Orchestrateur',
    level: 5,
    endpoint: '/api/agents/merlin',
    capabilities: ['task_execution', 'api_access', 'tool_calling'],
    status: 'active'
  },
  perplexity: {
    name: 'Perplexity (Comet)',
    role: 'Recherche & DevOps',
    level: 5,
    endpoint: '/api/agents/perplexity',
    capabilities: ['web_search', 'code_generation', 'browser_automation'],
    status: 'active'
  },
  chatgpt: {
    name: 'ChatGPT',
    role: 'Analyse & Bridge',
    level: 1,
    endpoint: '/api/agents/chatgpt',
    capabilities: ['analysis', 'memory', 'governance'],
    status: 'active'
  },
  gemini: {
    name: 'Gemini',
    role: 'System Admin',
    level: 1,
    endpoint: '/api/agents/gemini',
    capabilities: ['infrastructure', 'monitoring', 'security'],
    status: 'active'
  },
  claude: {
    name: 'Claude',
    role: 'Securite & Audit',
    level: 1,
    endpoint: '/api/agents/claude',
    capabilities: ['security_audit', 'code_review', 'rbac'],
    status: 'active'
  },
  kimi: {
    name: 'Kimi',
    role: 'Frontend & Dashboard',
    level: 5,
    endpoint: '/api/agents/kimi',
    capabilities: ['ui_generation', 'charts', 'dashboard'],
    status: 'active'
  },
  mexc: {
    name: 'MEXC Exchange',
    role: 'Exchange Trading',
    level: 5,
    endpoint: '/api/market',
    capabilities: ['spot_trading', 'price_feed', 'wallet'],
    status: 'connected'
  }
}

// Message types for inter-agent communication
const MSG_TYPES = {
  SIGNAL: 'trading_signal',
  ALERT: 'system_alert',
  TASK: 'task_assignment',
  STATUS: 'status_update',
  DATA: 'data_relay'
}

export default function AgentOrchestrator() {
  const [agents, setAgents] = useState(AGENT_REGISTRY)
  const [messageLog, setMessageLog] = useState([])
  const [taskQueue, setTaskQueue] = useState([])
  const [systemHealth, setSystemHealth] = useState({
    akashEscrow: 0,
    activeAgents: 0,
    pendingTasks: 0,
    lastSync: null
  })

  // Broadcast message to all agents or specific target
  const sendMessage = useCallback((from, to, type, payload) => {
    const msg = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      from,
      to: to || 'broadcast',
      type,
      payload,
      status: 'sent'
    }
    setMessageLog(prev => [msg, ...prev].slice(0, 100))
    return msg
  }, [])

  // Assign task to an agent based on RBAC
  const assignTask = useCallback((taskName, agentId, priority) => {
    const agent = agents[agentId]
    if (!agent) return null

    const task = {
      id: `task_${Date.now().toString(36)}`,
      name: taskName,
      assignedTo: agentId,
      priority: priority || 'MOYENNE',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    setTaskQueue(prev => [...prev, task])
    sendMessage('orchestrator', agentId, MSG_TYPES.TASK, task)
    return task
  }, [agents, sendMessage])

  // Check health of all systems
  const checkSystemHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setSystemHealth(data)
    } catch (e) {
      setSystemHealth(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        activeAgents: Object.values(agents).filter(a => a.status === 'active').length
      }))
    }
  }, [agents])

  // Poll system health every 30s
  useEffect(() => {
    checkSystemHealth()
    const interval = setInterval(checkSystemHealth, 30000)
    return () => clearInterval(interval)
  }, [checkSystemHealth])

  // Agent status color mapping
  const statusColor = (status) => {
    switch (status) {
      case 'active': return '#00ff88'
      case 'connected': return '#00ccff'
      case 'warning': return '#ffaa00'
      case 'error': return '#ff4444'
      default: return '#666'
    }
  }

  const priorityColor = (p) => {
    switch (p) {
      case 'CRITIQUE': return '#ff4444'
      case 'HAUTE': return '#ffaa00'
      case 'MOYENNE': return '#00ccff'
      case 'BASSE': return '#666'
      default: return '#8888a0'
    }
  }

  return (
    <div className="orchestrator">
      <div className="orch-header">
        <h2>Console Multi-Agent GOUV4</h2>
        <div className="health-bar">
          <span>Agents: {Object.values(agents).filter(a => a.status === 'active' || a.status === 'connected').length}/{Object.keys(agents).length}</span>
          <span>Tasks: {taskQueue.filter(t => t.status === 'pending').length} pending</span>
          <span>Last sync: {systemHealth.lastSync ? new Date(systemHealth.lastSync).toLocaleTimeString() : '--'}</span>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="orch-agents">
        {Object.entries(agents).map(([id, agent]) => (
          <div key={id} className="orch-agent-card">
            <div className="orch-agent-header">
              <span className="orch-dot" style={{ background: statusColor(agent.status) }} />
              <strong>{agent.name}</strong>
              <span className="orch-level">L{agent.level}</span>
            </div>
            <div className="orch-agent-role">{agent.role}</div>
            <div className="orch-agent-caps">
              {agent.capabilities.map(c => (
                <span key={c} className="orch-cap-tag">{c}</span>
              ))}
            </div>
            <div className="orch-agent-status" style={{ color: statusColor(agent.status) }}>
              {agent.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Task Queue */}
      <div className="orch-tasks">
        <h3>File de taches</h3>
        {taskQueue.length === 0 ? (
          <p className="orch-empty">Aucune tache en cours</p>
        ) : (
          taskQueue.slice(0, 10).map(task => (
            <div key={task.id} className="orch-task-item">
              <span className="orch-task-priority" style={{ color: priorityColor(task.priority) }}>
                [{task.priority}]
              </span>
              <span className="orch-task-name">{task.name}</span>
              <span className="orch-task-agent">-> {task.assignedTo}</span>
              <span className="orch-task-status">{task.status}</span>
            </div>
          ))
        )}
      </div>

      {/* Message Log */}
      <div className="orch-log">
        <h3>Journal Inter-Agent</h3>
        {messageLog.slice(0, 20).map(msg => (
          <div key={msg.id} className="orch-msg">
            <span className="orch-msg-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            <span className="orch-msg-from">{msg.from}</span>
            <span className="orch-msg-arrow">-></span>
            <span className="orch-msg-to">{msg.to}</span>
            <span className="orch-msg-type">[{msg.type}]</span>
          </div>
        ))}
      </div>
    </div>
  )
}
