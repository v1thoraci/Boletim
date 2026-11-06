// Configuração fixa do estudante (não pode ser alterada pela interface)
const CONFIG_ALUNO = {
  turma: "9B",
  numeroChamada: 36,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Variavel em memoria para guardar o PIN durante a sessao ativa
let pinSessao = "";

// Modo de edicao desativado por padrao
let modoEdicao = false;

// Instâncias dos gráficos Chart.js
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Dados ficticios brutos locais do 9º Ano (usados como fallback quando a API nao possui dados salvos)
const dadosBoletimLocais = [
  { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
  { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
  { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
  { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
  { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
  { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
  { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
  { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

// Dados atuais carregados em memoria
let dadosBoletimAtuais = [];

// Função para normalizar notas antigas/locais para a escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Converte texto com virgula para numero com ponto
  let numero = typeof valor === "string" ? parseFloat(valor.replace(",", ".")) : Number(valor);

  if (isNaN(numero)) {
    return null;
  }

  // Ajusta notas no formato 0-100 para a escala 0-10 (dados antigos)
  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }

  // Garante que a nota final esteja no intervalo valido de 0 a 10
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  return null;
}

// Validacao estrita para notas digitadas no modo de edicao (0 a 10)
function validarNotaDigitada(valorTexto) {
  const textoLimpo = String(valorTexto).trim();
  if (textoLimpo === "") {
    return { valido: true, valor: null };
  }
  const textoPonto = textoLimpo.replace(",", ".");
  const num = Number(textoPonto);
  if (!isNaN(num) && num >= 0 && num <= 10) {
    return { valido: true, valor: num };
  }
  return { valido: false, valor: null };
}

// Validacao para faltas digitadas no modo de edicao (inteiro >= 0)
function validarFaltaDigitada(valorTexto) {
  const textoLimpo = String(valorTexto).trim();
  if (textoLimpo === "") {
    return { valido: false, valor: null };
  }
  const num = Number(textoLimpo);
  if (Number.isInteger(num) && num >= 0) {
    return { valido: true, valor: num };
  }
  return { valido: false, valor: null };
}

// Gráfico 1: Média por Disciplina (Barras Horizontais)
function atualizarGraficoMedias() {
  const ctx = document.getElementById("graficoMediasDisciplinas");
  if (!ctx) return;

  if (graficoMedias) {
    graficoMedias.destroy();
  }

  const rotulos = [];
  const valores = [];

  dadosBoletimAtuais.forEach(item => {
    rotulos.push(item.disciplina);
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);
    const notasValidas = [n1, n2, n3].filter(n => n !== null);

    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, n) => acc + n, 0);
      valores.push(Number((soma / notasValidas.length).toFixed(1)));
    } else {
      valores.push(null);
    }
  });

  graficoMedias = new Chart(ctx, {
    type: "bar",
    data: {
      labels: rotulos,
      datasets: [{
        label: "Média",
        data: valores,
        backgroundColor: "#38bdf8",
        borderColor: "#0284c7",
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: 10,
          ticks: { color: "#1e293b" }
        },
        y: {
          ticks: { color: "#1e293b" }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = context.raw;
              return val !== null ? `Média: ${String(val).replace(".", ",")}` : "Sem notas disponíveis";
            }
          }
        }
      }
    }
  });
}

// Gráfico 2: Evolução da Média Geral (Linha)
function atualizarGraficoEvolucao() {
  const ctx = document.getElementById("graficoEvolucaoTrimestres");
  if (!ctx) return;

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
  }

  const notasTri1 = [];
  const notasTri2 = [];
  const notasTri3 = [];

  dadosBoletimAtuais.forEach(item => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    if (n1 !== null) notasTri1.push(n1);
    if (n2 !== null) notasTri2.push(n2);
    if (n3 !== null) notasTri3.push(n3);
  });

  const calcMediaArr = (arr) => {
    if (arr.length === 0) return null;
    const soma = arr.reduce((acc, n) => acc + n, 0);
    return Number((soma / arr.length).toFixed(1));
  };

  const m1 = calcMediaArr(notasTri1);
  const m2 = calcMediaArr(notasTri2);
  const m3 = calcMediaArr(notasTri3);

  graficoEvolucao = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Média Geral",
        data: [m1, m2, m3],
        borderColor: "#1e293b",
        backgroundColor: "rgba(56, 189, 248, 0.2)",
        fill: true,
        tension: 0.2,
        pointRadius: 5,
        pointBackgroundColor: "#38bdf8"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { color: "#1e293b" }
        },
        x: {
          ticks: { color: "#1e293b" }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = context.raw;
              return val !== null ? `Média: ${String(val).replace(".", ",")}` : "Sem notas";
            }
          }
        }
      }
    }
  });
}

// Gráfico 3: Faltas por Trimestre (Barras)
function atualizarGraficoFaltas() {
  const ctx = document.getElementById("graficoFaltasTrimestres");
  const estadoFaltasContainer = document.getElementById("estadoFaltas");
  const cardFaltas = document.getElementById("card-grafico-faltas");
  if (!ctx) return;

  if (graficoFaltas) {
    graficoFaltas.destroy();
  }

  let faltasTri1 = 0;
  let faltasTri2 = 0;
  let faltasTri3 = 0;

  dadosBoletimAtuais.forEach(item => {
    let f1 = 0, f2 = 0, f3 = 0;
    if (Array.isArray(item.faltas)) {
      f1 = Number(item.faltas[0]) || 0;
      f2 = Number(item.faltas[1]) || 0;
      f3 = Number(item.faltas[2]) || 0;
    } else if (item.faltas && typeof item.faltas === "object") {
      f1 = Number(item.faltas.tri1) || 0;
      f2 = Number(item.faltas.tri2) || 0;
      f3 = Number(item.faltas.tri3) || 0;
    }
    faltasTri1 += f1;
    faltasTri2 += f2;
    faltasTri3 += f3;
  });

  const totalAcumuladoFaltas = faltasTri1 + faltasTri2 + faltasTri3;
  const REFERENCIA_RISCO_INTERNA = 350;

  if (estadoFaltasContainer && cardFaltas) {
    if (totalAcumuladoFaltas >= REFERENCIA_RISCO_INTERNA) {
      estadoFaltasContainer.innerHTML = '<span class="badge-perigo">Perigo</span>';
      cardFaltas.classList.add("card-perigo");
    } else {
      estadoFaltasContainer.innerHTML = "";
      cardFaltas.classList.remove("card-perigo");
    }
  }

  graficoFaltas = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Faltas",
        data: [faltasTri1, faltasTri2, faltasTri3],
        backgroundColor: "#1e293b",
        borderColor: "#0f172a",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#1e293b" }
        },
        x: {
          ticks: { color: "#1e293b" }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.raw} faltas`
          }
        }
      }
    }
  });
}

// Atualiza a suíte completa de gráficos sem mutar o estado original
function atualizarGraficos() {
  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}

// Renderizacao da tabela e atualizacao dos cards
function renderizarInterface() {
  const corpoTabela = document.getElementById("tabela-boletim");
  corpoTabela.textContent = "";

  let somaMediasGerais = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let bomDesempenhoQtd = 0;
  let atencaoQtd = 0;

  dadosBoletimAtuais.forEach((item, index) => {
    // Normalizacao de notas
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Tratamento de faltas
    let f1 = 0, f2 = 0, f3 = 0;
    if (Array.isArray(item.faltas)) {
      f1 = Number(item.faltas[0]) || 0;
      f2 = Number(item.faltas[1]) || 0;
      f3 = Number(item.faltas[2]) || 0;
    } else if (item.faltas && typeof item.faltas === "object") {
      f1 = Number(item.faltas.tri1) || 0;
      f2 = Number(item.faltas.tri2) || 0;
      f3 = Number(item.faltas.tri3) || 0;
    }

    const totalFaltasDisc = f1 + f2 + f3;
    totalFaltasGeral += totalFaltasDisc;

    // Calculo de media e situacao
    const notasValidas = [n1, n2, n3].filter(n => n !== null);
    let media = null;
    let situacaoTexto = "Nota ainda não disponível";
    let situacaoClasse = "situacao-indisponivel";

    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, n) => acc + n, 0);
      media = soma / notasValidas.length;
      
      somaMediasGerais += media;
      qtdDisciplinasComMedia++;

      if (media >= 6.0) {
        situacaoTexto = "Bom desempenho";
        situacaoClasse = "situacao-bom";
        bomDesempenhoQtd++;
      } else {
        situacaoTexto = "Atenção";
        situacaoClasse = "situacao-atencao";
        atencaoQtd++;
      }
    }

    const formatarExibicao = n => n !== null ? n.toFixed(1).replace(".", ",") : "—";
    const tr = document.createElement("tr");

    // Coluna 1: Nome da disciplina (seguro contra XSS via textContent)
    const tdNome = document.createElement("td");
    tdNome.textContent = item.disciplina;
    tr.appendChild(tdNome);

    if (modoEdicao) {
      // Modos de entrada no formulário durante edicao
      const criarCellInput = (valorOriginal, classeInp, dataCampo) => {
        const td = document.createElement("td");
        const inp = document.createElement("input");
        inp.type = "text";
        inp.className = "input-edicao " + classeInp;
        inp.dataset.index = index;
        inp.dataset.campo = dataCampo;
        inp.value = valorOriginal !== null && valorOriginal !== undefined ? String(valorOriginal).replace(".", ",") : "";
        td.appendChild(inp);
        return td;
      };

      tr.appendChild(criarCellInput(n1, "inp-n1", "tri1"));
      tr.appendChild(criarCellInput(n2, "inp-n2", "tri2"));
      tr.appendChild(criarCellInput(n3, "inp-n3", "tri3"));

      const tdMedia = document.createElement("td");
      const strongMedia = document.createElement("strong");
      strongMedia.textContent = formatarExibicao(media);
      tdMedia.appendChild(strongMedia);
      tr.appendChild(tdMedia);

      tr.appendChild(criarCellInput(f1, "inp-f1", "f1"));
      tr.appendChild(criarCellInput(f2, "inp-f2", "f2"));
      tr.appendChild(criarCellInput(f3, "inp-f3", "f3"));

      const tdSit = document.createElement("td");
      tdSit.className = situacaoClasse;
      tdSit.textContent = situacaoTexto;
      tr.appendChild(tdSit);

    } else {
      // Exibição normal em modo de leitura
      const tdN1 = document.createElement("td");
      tdN1.textContent = formatarExibicao(n1);
      tr.appendChild(tdN1);

      const tdN2 = document.createElement("td");
      tdN2.textContent = formatarExibicao(n2);
      tr.appendChild(tdN2);

      const tdN3 = document.createElement("td");
      tdN3.textContent = formatarExibicao(n3);
      tr.appendChild(tdN3);

      const tdMedia = document.createElement("td");
      const strongMedia = document.createElement("strong");
      strongMedia.textContent = formatarExibicao(media);
      tdMedia.appendChild(strongMedia);
      tr.appendChild(tdMedia);

      const tdFaltas = document.createElement("td");
      tdFaltas.textContent = totalFaltasDisc;
      tr.appendChild(tdFaltas);

      const tdSit = document.createElement("td");
      tdSit.className = situacaoClasse;
      tdSit.textContent = situacaoTexto;
      tr.appendChild(tdSit);
    }

    corpoTabela.appendChild(tr);
  });

  // Atualização dos Cards de Resumo via DOM
  const mediaGeralFinal = qtdDisciplinasComMedia > 0 ? (somaMediasGerais / qtdDisciplinasComMedia).toFixed(1).replace(".", ",") : "—";
  
  document.getElementById("card-media-geral").textContent = mediaGeralFinal;
  document.getElementById("card-total-faltas").textContent = totalFaltasGeral;
  document.getElementById("card-bom-desempenho").textContent = bomDesempenhoQtd;
  document.getElementById("card-atencao").textContent = atencaoQtd;
  
  // Frequência fictícia e demonstrativa mantida intacta
  document.getElementById("card-frequencia").textContent = "92%";

  // Chamada pontual para atualizar os gráficos após a renderização da interface
  atualizarGraficos();
}

// Abertura do boletim conectando à API
async function abrirBoletim() {
  const inputPin = document.getElementById("input-pin");
  const msgLogin = document.getElementById("mensagem-login");
  const pinDigitado = inputPin.value.trim();

  if (!pinDigitado) {
    msgLogin.textContent = "Por favor, digite o seu PIN.";
    msgLogin.className = "mensagem-status mensagem-erro";
    return;
  }

  msgLogin.textContent = "Conectando...";
  msgLogin.className = "mensagem-status";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      msgLogin.textContent = "Turma, chamada ou PIN inválidos.";
      msgLogin.className = "mensagem-status mensagem-erro";
      return;
    }

    if (resposta.status === 429) {
      msgLogin.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      msgLogin.className = "mensagem-status mensagem-erro";
      return;
    }

    if (!resposta.ok) {
      msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      msgLogin.className = "mensagem-status mensagem-erro";
      return;
    }

    const resultado = await resposta.json();
    
    // Sucesso: armazena PIN na memoria da sessao e limpa o campo
    pinSessao = pinDigitado;
    inputPin.value = "";

    // Trata o retorno dos dados da API
    if (resultado.dados && Array.isArray(resultado.dados.disciplinas) && resultado.dados.disciplinas.length > 0) {
      dadosBoletimAtuais = resultado.dados.disciplinas;
    } else {
      // Fallback para os dados ficticios locais
      dadosBoletimAtuais = JSON.parse(JSON.stringify(dadosBoletimLocais));
    }

    // Exibe a tela principal do boletim
    document.getElementById("area-login").style.display = "none";
    document.getElementById("conteudo-boletim").style.display = "block";
    renderizarInterface();

  } catch (erro) {
    msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    msgLogin.className = "mensagem-status mensagem-erro";
  }
}

// Alternar entre modo de visualização e modo de edição
function alternarEdicao() {
  modoEdicao = !modoEdicao;
  const btnAlternar = document.getElementById("btn-alternar-edicao");
  const btnSalvar = document.getElementById("btn-salvar");
  const msgBoletim = document.getElementById("mensagem-boletim");

  msgBoletim.textContent = "";

  if (modoEdicao) {
    btnAlternar.textContent = "Cancelar edição";
    btnSalvar.style.display = "inline-block";
  } else {
    btnAlternar.textContent = "Alterar dados";
    btnSalvar.style.display = "none";
  }

  renderizarInterface();
}

// Salvar alterações na API
async function salvarAlteracoes() {
  const msgBoletim = document.getElementById("mensagem-boletim");
  msgBoletim.textContent = "";

  // Coleta os inputs de edicao
  const trs = document.querySelectorAll("#tabela-boletim tr");
  let haErros = false;
  const novasDisciplinas = [];

  trs.forEach((tr, index) => {
    const itemOriginal = dadosBoletimAtuais[index];
    const inpN1 = tr.querySelector(".inp-n1");
    const inpN2 = tr.querySelector(".inp-n2");
    const inpN3 = tr.querySelector(".inp-n3");
    const inpF1 = tr.querySelector(".inp-f1");
    const inpF2 = tr.querySelector(".inp-f2");
    const inpF3 = tr.querySelector(".inp-f3");

    // Validacao das notas
    const vN1 = validarNotaDigitada(inpN1.value);
    const vN2 = validarNotaDigitada(inpN2.value);
    const vN3 = validarNotaDigitada(inpN3.value);

    // Validacao das faltas
    const vF1 = validarFaltaDigitada(inpF1.value);
    const vF2 = validarFaltaDigitada(inpF2.value);
    const vF3 = validarFaltaDigitada(inpF3.value);

    // Destaque visual para campos invalidos
    inpN1.classList.toggle("input-invalido", !vN1.valido);
    inpN2.classList.toggle("input-invalido", !vN2.valido);
    inpN3.classList.toggle("input-invalido", !vN3.valido);
    inpF1.classList.toggle("input-invalido", !vF1.valido);
    inpF2.classList.toggle("input-invalido", !vF2.valido);
    inpF3.classList.toggle("input-invalido", !vF3.valido);

    if (!vN1.valido || !vN2.valido || !vN3.valido || !vF1.valido || !vF2.valido || !vF3.valido) {
      haErros = true;
    }

    novasDisciplinas.push({
      disciplina: itemOriginal.disciplina,
      tri1: vN1.valor,
      tri2: vN2.valor,
      tri3: vN3.valor,
      faltas: [vF1.valor || 0, vF2.valor || 0, vF3.valor || 0]
    });
  });

  if (haErros) {
    msgBoletim.textContent = "Verifique os campos destacados em vermelho antes de salvar.";
    msgBoletim.className = "mensagem-status mensagem-erro";
    return;
  }

  msgBoletim.textContent = "Salvando...";
  msgBoletim.className = "mensagem-status";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      msgBoletim.textContent = "Não foi possível salvar as alterações. Tente novamente.";
      msgBoletim.className = "mensagem-status mensagem-erro";
      return;
    }

    // Atualiza os dados locais com sucesso
    dadosBoletimAtuais = novasDisciplinas;
    modoEdicao = false;

    document.getElementById("btn-alternar-edicao").textContent = "Alterar dados";
    document.getElementById("btn-salvar").style.display = "none";

    renderizarInterface();

    msgBoletim.textContent = "Dados salvos com sucesso.";
    msgBoletim.className = "mensagem-status mensagem-sucesso";

  } catch (erro) {
    msgBoletim.textContent = "Não foi possível salvar as alterações. Tente novamente.";
    msgBoletim.className = "mensagem-status mensagem-erro";
  }
}

// Configuração dos eventos da página
document.getElementById("btn-entrar").addEventListener("click", abrirBoletim);
document.getElementById("input-pin").addEventListener("keypress", (e) => {
  if (e.key === "Enter") abrirBoletim();
});
document.getElementById("btn-alternar-edicao").addEventListener("click", alternarEdicao);
document.getElementById("btn-salvar").addEventListener("click", salvarAlteracoes);