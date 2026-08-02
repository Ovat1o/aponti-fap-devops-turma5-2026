const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// 1. IMPORTANDO AS FUNÇÕES REAIS DO SEU SCRIPT
const {
  lerAlunos,
  removerDuplicados,
  ordenarAlunos,
  gerarTabela,
} = require('../scripts/gerar-readme.js');

// Caminho real para a pasta de alunos
const pastaAlunos = path.join(__dirname, '../alunos');

test('T01 - Pasta alunos existente', () => {
  // A função lerAlunos não deve estourar erro se a pasta existir
  assert.doesNotThrow(() => {
    lerAlunos(pastaAlunos);
  }, 'A leitura da pasta existente não deve lançar erros.');
});

test('T02 - Pasta alunos inexistente', () => {
  const pastaInexistente = path.join(__dirname, '../alunos_fake');
  
  // A função deve obrigatoriamente lançar um erro com a mensagem exata
  assert.throws(() => {
    lerAlunos(pastaInexistente);
  }, { message: "Pasta 'alunos' não encontrada." });
});

test('T04, T05, T06 e T07 - Validação na leitura de arquivos (Faltando dados ou inválidos)', () => {
  // Para testar leitura, criamos uma pasta temporária com cenários defeituosos
  const tempPath = path.join(__dirname, 'temp_alunos_teste');
  if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath);

  try {
    fs.writeFileSync(path.join(tempPath, 'sem_nome.json'), JSON.stringify({ github: 'git1' })); // T04
    fs.writeFileSync(path.join(tempPath, 'sem_git.json'), JSON.stringify({ nome: 'Nome 2' })); // T05
    fs.writeFileSync(path.join(tempPath, 'imagem.png'), 'isso é uma imagem'); // T06
    fs.writeFileSync(path.join(tempPath, 'invalido.json'), '{ json quebrado }'); // T07
    fs.writeFileSync(path.join(tempPath, 'valido.json'), JSON.stringify({ nome: 'Aluno Certo', github: 'alunocerto' })); // Válido

    const alunosProcessados = lerAlunos(tempPath);

    // Dentre os 5 arquivos, apenas 1 atende a todas as regras
    assert.strictEqual(alunosProcessados.length, 1);
    assert.strictEqual(alunosProcessados[0].nome, 'Aluno Certo');
  } finally {
    // Limpeza da pasta temporária após o teste
    fs.rmSync(tempPath, { recursive: true, force: true });
  }
});

test('T08 - GitHub duplicado deve manter apenas um registro (Case Insensitive)', () => {
  const listaComDuplicatas = [
    { nome: 'Aluno 1', github: 'Dev-Duplicado' }, // Maiúsculo
    { nome: 'Aluno 2', github: 'dev-duplicado' }, // Minúsculo
    { nome: 'Aluno 3', github: 'dev-unico' }
  ];

  const resultado = removerDuplicados(listaComDuplicatas);

  assert.strictEqual(resultado.length, 2, 'Deve sobrar apenas 2 registros únicos.');
  assert.strictEqual(resultado[0].nome, 'Aluno 1', 'Deve manter o primeiro registro encontrado.');
});

test('T09 - Ordenação alfabética pelo campo nome', () => {
  const alunosDesordenados = [
    { nome: 'Zuleica', github: 'z' },
    { nome: 'Ana', github: 'a' },
    { nome: 'Carlos', github: 'c' }
  ];

  const ordenados = ordenarAlunos(alunosDesordenados);

  assert.strictEqual(ordenados[0].nome, 'Ana');
  assert.strictEqual(ordenados[1].nome, 'Carlos');
  assert.strictEqual(ordenados[2].nome, 'Zuleica');
});

test('T03, T10 e T11 - Geração da Tabela e propriedades opcionais ausentes', () => {
  const alunos = [
    { 
      nome: 'Maria Silva', 
      github: 'mariasilva', 
      cidade: 'Rio de Janeiro', 
      linkedin: 'https://linkedin.com/in/maria' 
    }, // Completo (T03)
    { 
      nome: 'João Sem Redes', 
      github: 'joaogit' 
    } // Opcionais ausentes (T10 e T11)
  ];

  const tabelaGerada = gerarTabela(alunos);

  // Valida o aluno completo (T03)
  assert.ok(tabelaGerada.includes('| <img src="https://github.com/mariasilva.png" width="50"> | Maria Silva | [@mariasilva](https://github.com/mariasilva) | Rio de Janeiro | [Perfil](https://linkedin.com/in/maria) |'));
  
  // Valida os hífens "-" para dados ausentes (T10 e T11)
  assert.ok(tabelaGerada.includes('| <img src="https://github.com/joaogit.png" width="50"> | João Sem Redes | [@joaogit](https://github.com/joaogit) | - | - |'));
});

test('T12 - Estrutura da Tabela no README', () => {
  // Passamos um aluno falso apenas para gerar a tabela e checar o cabeçalho
  const tabela = gerarTabela([{ nome: 'Teste', github: 'teste' }]);
  
  // Verifica se o cabeçalho correto está sendo montado
  assert.ok(tabela.includes('| Avatar | Nome | GitHub | Cidade | LinkedIn |'));
  assert.ok(tabela.includes('|---------|---------|---------|---------|---------|'));
});

test('T13 - Estatísticas de total de alunos válidos (Integração Local)', () => {
  // Teste de integração real: usa o pipeline completo nas funções modulares
  const alunos = lerAlunos(pastaAlunos);
  const unicos = removerDuplicados(alunos);
  const final = ordenarAlunos(unicos);

  // Apenas garante que a contagem resulta em um número real (validação do processo)
  assert.strictEqual(typeof final.length, 'number');
  assert.ok(final.length >= 0, 'O total de alunos deve ser 0 ou maior');
});