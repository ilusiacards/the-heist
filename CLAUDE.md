# The Heist

## G Stack (Garry Tan's Claude Code setup)

Instalado en `~/.claude/skills/gstack` — versión 1.1.0.

Usá `/gstack` para activar el skill principal. Las herramientas disponibles son:

### Flujo de trabajo y planificación
| Comando | Descripción |
|---------|-------------|
| `/autoplan` | Genera un plan de implementación automático antes de codear |
| `/plan-eng-review` | Revisión de un plan técnico por un ingeniero sénior |
| `/plan-design-review` | Revisión de diseño de un plan |
| `/plan-ceo-review` | Revisión de un plan desde perspectiva de negocio |
| `/plan-devex-review` | Revisión de developer experience |
| `/plan-tune` | Ajusta y mejora un plan existente |

### QA y testing
| Comando | Descripción |
|---------|-------------|
| `/qa` | QA completo: explora la app, encuentra bugs, reporta con evidencia |
| `/qa-only` | QA enfocado en una feature específica |
| `/canary` | Despliega y monitorea un canary release |
| `/health` | Chequeo de salud del proyecto (tests, lint, build) |

### Diseño
| Comando | Descripción |
|---------|-------------|
| `/design` | Genera mockups y exploración visual |
| `/design-html` | Genera componentes HTML/CSS interactivos |
| `/design-consultation` | Consulta de diseño para una feature |
| `/design-shotgun` | Genera múltiples variantes de diseño rápido |
| `/design-review` | Revisión de diseño existente |

### Browser / scraping
| Comando | Descripción |
|---------|-------------|
| `/browse` | Navega, inspecciona y hace screenshots de páginas web |
| `/scrape` | Extrae datos estructurados de una página |
| `/open-gstack-browser` | Abre el browser visual de gstack |
| `/setup-browser-cookies` | Configura cookies de autenticación para el browser |

### Deploy y entrega
| Comando | Descripción |
|---------|-------------|
| `/ship` | Flujo completo: plan → review → deploy |
| `/land-and-deploy` | Hace merge y despliega |
| `/setup-deploy` | Configura el pipeline de deploy |

### Revisión de código
| Comando | Descripción |
|---------|-------------|
| `/review` | Code review detallado del diff actual |
| `/devex-review` | Revisión de developer experience |

### Documentación
| Comando | Descripción |
|---------|-------------|
| `/document-generate` | Genera documentación desde el código |
| `/document-release` | Genera release notes |
| `/make-pdf` | Exporta documentación a PDF |
| `/landing-report` | Genera un reporte de landing page |

### Contexto y memoria
| Comando | Descripción |
|---------|-------------|
| `/context-save` | Guarda el contexto actual de la sesión |
| `/context-restore` | Restaura un contexto guardado |
| `/learn` | Registra aprendizajes del proyecto |

### iOS
| Comando | Descripción |
|---------|-------------|
| `/ios-fix` | Corrige un bug en iOS |
| `/ios-qa` | QA de la app iOS |
| `/ios-clean` | Limpia el build de iOS |
| `/ios-sync` | Sincroniza dependencias iOS |
| `/ios-design-review` | Revisión de diseño iOS |

### Utilidades
| Comando | Descripción |
|---------|-------------|
| `/investigate` | Investiga un bug o comportamiento raro |
| `/retro` | Genera una retrospectiva del sprint |
| `/office-hours` | Sesión de consulta interactiva |
| `/benchmark` | Benchmark de performance |
| `/benchmark-models` | Compara modelos de Claude |
| `/pair-agent` | Lanza un agente paralelo como pair programmer |
| `/skillify` | Convierte una tarea repetitiva en un skill |
| `/freeze` | Congela una dependencia en su versión actual |
| `/unfreeze` | Descongela una dependencia |
| `/guard` | Agrega guardrails a una operación riesgosa |
| `/careful` | Modo cuidadoso: pide confirmación antes de cada acción |
| `/cso` | Chief of Staff: prioriza y organiza el trabajo |
| `/codex` | Integración con OpenAI Codex |
| `/gstack-upgrade` | Actualiza gstack a la última versión |
| `/setup-gbrain` | Configura GBrain (memoria persistente avanzada) |
| `/sync-gbrain` | Sincroniza con GBrain |

### Información del setup
- **Bun**: 1.3.14 (instalado en `~/.bun/bin/bun`)
- **Git**: 2.39.5
- **Ruta gstack**: `~/.claude/skills/gstack`
- Para actualizar: `/gstack-upgrade`

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
