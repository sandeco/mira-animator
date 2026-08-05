Você tem razão. Eu mandei uma referência vaga para um plano que não estava no prompt atual.

Envie **este prompt completo** ao Codex:

```text
Implemente o primeiro slice de uma instalação global opcional para o Mira Animator.

Contexto:
- o comportamento local atual deve permanecer totalmente compatível;
- install e update sem flags continuam operando na pasta atual;
- este slice cria apenas o cache global;
- ainda não conecte workspaces ao cache;
- ainda não crie symlinks, junctions ou registro de workspaces;
- não implemente update --all;
- não altere decks existentes.

Objetivo:
Adicionar os comandos:

npx mira-animator global install
npx mira-animator global update
npx mira-animator global status

Diretório global:
- usar o diretório home do usuário;
- criar ~/.mira;
- resolver o home com APIs multiplataforma do Node;
- não concatenar USERPROFILE manualmente.

Estrutura esperada:

~/.mira/
├── current/
│   ├── agents/
│   ├── templates/
│   └── installation.json
└── state.json

Contrato do comando global install:
- criar ~/.mira/current;
- copiar agents e templates distribuídos pelo pacote;
- gravar metadados da instalação;
- ser idempotente;
- não escrever na pasta atual;
- não criar mira.config.json local;
- não criar decks;
- não modificar .claude.

Contrato do comando global update:
- atualizar agents e templates;
- usar publicação atômica;
- preservar a instalação anterior se a atualização falhar;
- não modificar workspaces locais.

Contrato do comando global status:
- informar se a instalação global existe;
- mostrar caminho absoluto;
- mostrar versão instalada;
- mostrar versão do pacote em execução;
- verificar integridade básica de agents e templates;
- retornar exit code diferente de zero somente se a instalação estiver corrompida;
- instalação ausente não deve ser tratada como corrupção.

Arquitetura:
- criar módulo isolado para resolução dos caminhos globais;
- criar módulo isolado para instalação e publicação do cache;
- reutilizar lógica de cópia existente quando for seguro;
- usar apenas APIs Node para arquivos e caminhos;
- tratar caminhos com espaços;
- não depender de instalação npm global.

Compatibilidade obrigatória:
- não alterar o comportamento de:
  - mira-animator install
  - mira-animator update
  - mira-animator status
- não mudar mensagens ou contratos utilizados pelos testes existentes.

Testes obrigatórios:
- resolução do caminho global;
- instalação global em diretório temporário;
- idempotência;
- atualização;
- rollback em falha;
- status ausente;
- status válido;
- status corrompido;
- garantia de que nenhum arquivo é criado no cwd;
- suíte completa existente.

Testabilidade:
- permitir substituir o diretório global nos testes;
- nunca usar o home real nos testes;
- não deixar arquivos fora do diretório temporário.

Não implementar neste slice:
- symlinks;
- junctions;
- use-global;
- workspaces.json;
- update --all;
- migração de instalações locais;
- alterações extensas de documentação.

Ao finalizar:
1. explique a arquitetura adotada;
2. liste arquivos criados e alterados;
3. mostre os testes adicionados;
4. execute npm test;
5. execute git diff --check;
6. não faça commit.
```
