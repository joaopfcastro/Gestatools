import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseLayoutFile,
  parseFixedWidthData,
} from './lib/fixedWidthParser.mjs';
import {
  transformCidRecords,
  transformProcedureRecords,
  transformRelationRecords,
  createManifest,
} from './lib/sigtapTransform.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to parse CLI args
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: '',
    competence: '202607',
    output: path.resolve(__dirname, '../public/data/clinical-codes'),
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      options.input = args[++i];
    } else if (args[i] === '--competence' && args[i + 1]) {
      options.competence = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[++i];
    }
  }

  return options;
}

// Default official dataset for GestaTools (SIGTAP 07/2026)
const OFFICIAL_CIDS = [
  // Partos
  { CO_CID: 'O80', NO_CID: 'PARTO ÚNICO ESPONTÂNEO' },
  { CO_CID: 'O80.0', NO_CID: 'PARTO ÚNICO ESPONTÂNEO, APRESENTAÇÃO CEFÁLICA VÉRTICE' },
  { CO_CID: 'O80.1', NO_CID: 'PARTO ÚNICO ESPONTÂNEO, APRESENTAÇÃO PÉLVICA OU PODÁLICA' },
  { CO_CID: 'O80.8', NO_CID: 'OUTRO PARTO ÚNICO ESPONTÂNEO' },
  { CO_CID: 'O80.9', NO_CID: 'PARTO ÚNICO ESPONTÂNEO, NÃO ESPECIFICADO' },
  { CO_CID: 'O81', NO_CID: 'PARTO ÚNICO POR FÓRCEPS OU VÁCUO-EXTRATOR' },
  { CO_CID: 'O81.0', NO_CID: 'PARTO ÚNICO POR FÓRCEPSBAIXO' },
  { CO_CID: 'O81.4', NO_CID: 'PARTO ÚNICO POR VÁCUO-EXTRATOR' },
  { CO_CID: 'O82', NO_CID: 'PARTO ÚNICO POR CESARIANA' },
  { CO_CID: 'O82.0', NO_CID: 'PARTO POR CESARIANA ELETIVA' },
  { CO_CID: 'O82.1', NO_CID: 'PARTO POR CESARIANA DE URGÊNCIA' },
  { CO_CID: 'O82.2', NO_CID: 'PARTO POR CESARIANA COM HISTERECTOMIA' },
  { CO_CID: 'O82.8', NO_CID: 'OUTRO PARTO ÚNICO POR CESARIANA' },
  { CO_CID: 'O82.9', NO_CID: 'PARTO POR CESARIANA, NÃO ESPECIFICADO' },
  { CO_CID: 'O83', NO_CID: 'OUTROS PARTOS ÚNICOS ASSISTIDOS' },
  { CO_CID: 'O83.0', NO_CID: 'PARTO POR EXTRAÇÃO PÉLVICA' },
  { CO_CID: 'O83.1', NO_CID: 'OUTRO PARTO ASSISTIDO PÉLVICO' },
  { CO_CID: 'O84', NO_CID: 'PARTO MÚLTIPLO' },
  { CO_CID: 'O84.0', NO_CID: 'PARTO MÚLTIPLO, TODOS ESPONTÂNEOS' },
  { CO_CID: 'O84.2', NO_CID: 'PARTO MÚLTIPLO, TODOS POR CESARIANA' },

  // Síndromes Hipertensivas
  { CO_CID: 'O10', NO_CID: 'HIPERTENSÃO PRÉ-EXISTENTE COMPLICANDO A GRAVIDEZ, O PARTO E O PUERPÉRIO' },
  { CO_CID: 'O11', NO_CID: 'HIPERTENSÃO PRÉ-EXISTENTE COM PRÉ-ECLÂMPSIA SOBREPOSTA' },
  { CO_CID: 'O13', NO_CID: 'HIPERTENSÃO GESTACIONAL (INDUCIDA PELA GRAVIDEZ)' },
  { CO_CID: 'O14', NO_CID: 'PRÉ-ECLÂMPSIA' },
  { CO_CID: 'O14.0', NO_CID: 'PRÉ-ECLÂMPSIA LEVE A MODERADA' },
  { CO_CID: 'O14.1', NO_CID: 'PRÉ-ECLÂMPSIA GRAVE' },
  { CO_CID: 'O14.9', NO_CID: 'PRÉ-ECLÂMPSIA NÃO ESPECIFICADA' },
  { CO_CID: 'O15', NO_CID: 'ECLÂMPSIA' },
  { CO_CID: 'O15.0', NO_CID: 'ECLÂMPSIA NA GRAVIDEZ' },
  { CO_CID: 'O15.1', NO_CID: 'ECLÂMPSIA NO TRABALHO DE PARTO' },
  { CO_CID: 'O15.2', NO_CID: 'ECLÂMPSIA NO PUERPÉRIO' },
  { CO_CID: 'O15.9', NO_CID: 'ECLÂMPSIA, NÃO ESPECIFICADA QUANTO AO PERÍODO' },
  { CO_CID: 'O16', NO_CID: 'HIPERTENSÃO MATERNA NÃO ESPECIFICADA' },

  // Diabetes & Outras complicações metabólicas
  { CO_CID: 'O24', NO_CID: 'DIABETES MELLITUS NA GRAVIDEZ, NO PARTO E NO PUERPÉRIO' },
  { CO_CID: 'O24.4', NO_CID: 'DIABETES MELLITUS QUE SURGE NA GRAVIDEZ (DIABETES GESTACIONAL)' },

  // Hemorragias e Abortamentos
  { CO_CID: 'O20', NO_CID: 'HEMORRAGIA DO INÍCIO DA GRAVIDEZ' },
  { CO_CID: 'O20.0', NO_CID: 'AMEAÇA DE ABORTAMENTO' },
  { CO_CID: 'O03', NO_CID: 'ABORTAMENTO ESPONTÂNEO' },
  { CO_CID: 'O04', NO_CID: 'ABORTAMENTO POR RAZÕES MÉDICAS E LEGAIS' },
  { CO_CID: 'O05', NO_CID: 'OUTRO ABORTAMENTO' },
  { CO_CID: 'O06', NO_CID: 'ABORTAMENTO NÃO ESPECIFICADO' },

  // Transtornos do Líquido Amniótico & Crescimento Fetal
  { CO_CID: 'O26', NO_CID: 'OUTRAS AFECÇÕES MATERNAS RELACIONADAS PREDOMINANTEMENTE COM A GRAVIDEZ' },
  { CO_CID: 'O26.8', NO_CID: 'OUTRAS AFECÇÕES ESPECIFICADAS LIGADAS À GRAVIDEZ' },
  { CO_CID: 'O36.3', NO_CID: 'ASSISTÊNCIA MATERNA POR ANOXIA FETAL' },
  { CO_CID: 'O36.5', NO_CID: 'ASSISTÊNCIA MATERNA POR RETARDAMENTO DO CRESCIMENTO FETAL' },
  { CO_CID: 'O40', NO_CID: 'POLIDRÂMNIO' },
  { CO_CID: 'O41.0', NO_CID: 'OLIGODRÂMNIO' },
  { CO_CID: 'O41.1', NO_CID: 'INFECÇÃO DA CAVIDADE AMNIÓTICA E DAS MEMBRANAS' },
  { CO_CID: 'O42', NO_CID: 'RUPTURA PREMATURA DE MEMBRANAS' },
  { CO_CID: 'O42.0', NO_CID: 'RUPTURA PREMATURA DE MEMBRANAS, TRABALHO DE PARTO NAS 24 HORAS SEGUINTES' },
  { CO_CID: 'O42.1', NO_CID: 'RUPTURA PREMATURA DE MEMBRANAS, TRABALHO DE PARTO APÓS 24 HORAS' },
  { CO_CID: 'O44', NO_CID: 'PLACENTA PRÉVIA' },
  { CO_CID: 'O44.0', NO_CID: 'PLACENTA PRÉVIA SEM HEMORRAGIA' },
  { CO_CID: 'O44.1', NO_CID: 'PLACENTA PRÉVIA COM HEMORRAGIA' },
  { CO_CID: 'O45', NO_CID: 'DESCOLAMENTO PREMATURO DA PLACENTA [DPP]' },
  { CO_CID: 'O45.0', NO_CID: 'DESCOLAMENTO PREMATURO DA PLACENTA COMDEFEITO DA COAGULAÇÃO' },
  { CO_CID: 'O45.9', NO_CID: 'DESCOLAMENTO PREMATURO DA PLACENTA, NÃO ESPECIFICADO' },
  { CO_CID: 'O60', NO_CID: 'TRABALHO DE PARTO PREMATURO' },
  { CO_CID: 'O60.0', NO_CID: 'TRABALHO DE PARTO PREMATURO SEM PARTO' },
  { CO_CID: 'O60.1', NO_CID: 'TRABALHO DE PARTO PREMATURO COM PARTO' },
  { CO_CID: 'O70', NO_CID: 'LACERAÇÃO DO PERÍNEO DURANTE O PARTO' },
  { CO_CID: 'O70.0', NO_CID: 'LACERAÇÃO DE PRIMEIRA GRAU DO PERÍNEO DURANTE O PARTO' },
  { CO_CID: 'O70.1', NO_CID: 'LACERAÇÃO DE SEGUNDO GRAU DO PERÍNEO DURANTE O PARTO' },
  { CO_CID: 'O72', NO_CID: 'HEMORRAGIA PÓS-PARTO' },
  { CO_CID: 'O72.0', NO_CID: 'HEMORRAGIA DO TERCEIRO PERÍODO DO PARTO' },
  { CO_CID: 'O72.1', NO_CID: 'OUTRA HEMORRAGIA PÓS-PARTO IMEDIATA' },

  // Fatores de Pré-natal / Puerpério
  { CO_CID: 'Z32.1', NO_CID: 'GRAVIDEZ CONFIRMADA' },
  { CO_CID: 'Z34', NO_CID: 'SUPERVISÃO DE GRAVIDEZ NORMAL' },
  { CO_CID: 'Z34.0', NO_CID: 'SUPERVISÃO DE PRIMEIRA GRAVIDEZ NORMAL' },
  { CO_CID: 'Z34.8', NO_CID: 'SUPERVISÃO DE OUTRAS GRAVIDEZES NORMAIS' },
  { CO_CID: 'Z34.9', NO_CID: 'SUPERVISÃO DE GRAVIDEZ NORMAL, NÃO ESPECIFICADA' },
  { CO_CID: 'Z35', NO_CID: 'SUPERVISÃO DE GRAVIDEZ DE ALTO RISCO' },
  { CO_CID: 'Z35.0', NO_CID: 'SUPERVISÃO DE GRAVIDEZ COM HISTÓRIA DE INFERTILIDADE' },
  { CO_CID: 'Z35.1', NO_CID: 'SUPERVISÃO DE GRAVIDEZ COM HISTÓRIA DE ABORTAMENTO DE REPETIÇÃO' },
  { CO_CID: 'Z35.2', NO_CID: 'SUPERVISÃO DE GRAVIDEZ COM HISTÓRIA DE OUTRO PARTO TARDIO OU GRAVIDEZ PROBLEMÁTICA' },
  { CO_CID: 'Z35.8', NO_CID: 'SUPERVISÃO DE OUTRAS GRAVIDEZES DE ALTO RISCO' },
  { CO_CID: 'Z35.9', NO_CID: 'SUPERVISÃO DE GRAVIDEZ DE ALTO RISCO, NÃO ESPECIFICADA' },
  { CO_CID: 'Z39.0', NO_CID: 'ATENDIMENTO E EXAME IMEDIATAMENTE APÓS O PARTO' },
  { CO_CID: 'Z39.1', NO_CID: 'ATENDIMENTO E EXAME DA MÃE LACTANTE' },
  { CO_CID: 'Z39.2', NO_CID: 'ACOMPANHAMENTO DE ROTINA DO PÓS-PARTO' },

  // Infecções
  { CO_CID: 'A53.0', NO_CID: 'SÍFILIS LATENTE, NÃO ESPECIFICADA SE PRECOCE OU TARDIA' },
  { CO_CID: 'A53.9', NO_CID: 'SÍFILIS NÃO ESPECIFICADA' },
  { CO_CID: 'B20', NO_CID: 'DOENÇA PELO VÍRUS DA IMUNODEFICIÊNCIA HUMANA [HIV]' },
  { CO_CID: 'B24', NO_CID: 'DOENÇA PELO VÍRUS DA IMUNODEFICIÊNCIA HUMANA [HIV] NÃO ESPECIFICADA' },
  { CO_CID: 'N39.0', NO_CID: 'INFECÇÃO DO TRATO URINÁRIO DE LOCALIZAÇÃO NÃO ESPECIFICADA' },
];

const OFFICIAL_PROCEDURES = [
  {
    CO_PROCEDIMENTO: '0310010039',
    NO_PROCEDIMENTO: 'PARTO NORMAL',
    DS_PROCEDIMENTO: 'CONSISTE NO ATENDIMENTO AO PARTO VAGINAL SPONTÂNEO OU ASSISTIDO DE APRESENTAÇÃO CEFÁLICA.',
    CO_GRUPO: '03',
    groupName: 'PROCEDIMENTOS CLÍNICOS',
    CO_SUB_GRUPO: '10',
    subgroupName: 'ASSISTÊNCIA AO PARTO E PUERPÉRIO',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'ASSISTÊNCIA AO PARTO',
  },
  {
    CO_PROCEDIMENTO: '0310010047',
    NO_PROCEDIMENTO: 'PARTO NORMAL EM CENTRO DE PARTO NORMAL (CPN)',
    DS_PROCEDIMENTO: 'ATENDIMENTO AO PARTO NORMAL HUMANIZADO REALIZADO EM CENTRO DE PARTO NORMAL.',
    CO_GRUPO: '03',
    groupName: 'PROCEDIMENTOS CLÍNICOS',
    CO_SUB_GRUPO: '10',
    subgroupName: 'ASSISTÊNCIA AO PARTO E PUERPÉRIO',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'ASSISTÊNCIA AO PARTO',
  },
  {
    CO_PROCEDIMENTO: '0411010034',
    NO_PROCEDIMENTO: 'PARTO CESARIANO',
    DS_PROCEDIMENTO: 'PROCEDIMENTO CIRÚRGICO PARA RETIRADA DO CONCEITO VIA LAPAROTOMIA E HISTEROTOMIA.',
    CO_GRUPO: '04',
    groupName: 'PROCEDIMENTOS CIRÚRGICOS',
    CO_SUB_GRUPO: '11',
    subgroupName: 'OBSTETRÍCIA',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'PARTO E PUERPÉRIO',
  },
  {
    CO_PROCEDIMENTO: '0411010042',
    NO_PROCEDIMENTO: 'PARTO CESARIANO EM GESTAÇÃO DE ALTO RISCO',
    DS_PROCEDIMENTO: 'PARTO CESARIANO INDICADO DEVIDO A PATOLOGIAS MATERNAS OU FETAIS DE ALTO RISCO.',
    CO_GRUPO: '04',
    groupName: 'PROCEDIMENTOS CIRÚRGICOS',
    CO_SUB_GRUPO: '11',
    subgroupName: 'OBSTETRÍCIA',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'PARTO E PUERPÉRIO',
  },
  {
    CO_PROCEDIMENTO: '0411010026',
    NO_PROCEDIMENTO: 'PARTO CESARIANO C/ LAQUEADURA TUBÁRIA',
    DS_PROCEDIMENTO: 'REALIZAÇÃO DE PARTO CESARIANO ASSOCIADO À LAQUEADURA TUBÁRIA CONFORME LEGISLAÇÃO VIGENTE.',
    CO_GRUPO: '04',
    groupName: 'PROCEDIMENTOS CIRÚRGICOS',
    CO_SUB_GRUPO: '11',
    subgroupName: 'OBSTETRÍCIA',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'PARTO E PUERPÉRIO',
  },
  {
    CO_PROCEDIMENTO: '0205020143',
    NO_PROCEDIMENTO: 'ULTRASSONOGRAFIA OBSTÉTRICA',
    DS_PROCEDIMENTO: 'EXAME ULTRASSONOGRÁFICO PARA AVALIAÇÃO DO CRESCIMENTO FETAL, IDADE GESTACIONAL, PLACENTA E LÍQUIDO AMNIÓTICO.',
    CO_GRUPO: '02',
    groupName: 'PROCEDIMENTOS DIAGNÓSTICOS',
    CO_SUB_GRUPO: '05',
    subgroupName: 'DIAGNÓSTICO POR ULTRASSONOGRAFIA',
    CO_FORMA_ORGANIZACAO: '02',
    organizationName: 'ULTRASSONOGRAFIA',
  },
  {
    CO_PROCEDIMENTO: '0205020151',
    NO_PROCEDIMENTO: 'ULTRASSONOGRAFIA OBSTÉTRICA C/ DOPPLER COLORIDO',
    DS_PROCEDIMENTO: 'AVALIAÇÃO HEMODINÂMICA MATERNO-FETAL VIA DOPPLERVELOCIMETRIA DAS ARTÉRIAS UTERINAS, UMBILICAL E CEREBRAL MÉDIA.',
    CO_GRUPO: '02',
    groupName: 'PROCEDIMENTOS DIAGNÓSTICOS',
    CO_SUB_GRUPO: '05',
    subgroupName: 'DIAGNÓSTICO POR ULTRASSONOGRAFIA',
    CO_FORMA_ORGANIZACAO: '02',
    organizationName: 'ULTRASSONOGRAFIA',
  },
  {
    CO_PROCEDIMENTO: '0205020160',
    NO_PROCEDIMENTO: 'ULTRASSONOGRAFIA OBSTÉTRICA MORFOLÓGICA',
    DS_PROCEDIMENTO: 'AVALIAÇÃO ANATÔMICA FETAL DETALHADA NO PRIMEIRO OU SEGUNDO TRIMESTRE.',
    CO_GRUPO: '02',
    groupName: 'PROCEDIMENTOS DIAGNÓSTICOS',
    CO_SUB_GRUPO: '05',
    subgroupName: 'DIAGNÓSTICO POR ULTRASSONOGRAFIA',
    CO_FORMA_ORGANIZACAO: '02',
    organizationName: 'ULTRASSONOGRAFIA',
  },
  {
    CO_PROCEDIMENTO: '0205020186',
    NO_PROCEDIMENTO: 'ULTRASSONOGRAFIA TRANSVAGINAL',
    DS_PROCEDIMENTO: 'EXAME ULTRASSONOGRÁFICO ENDOVAGINAL PARA AVALIAÇÃO PRECOCE DA GESTAÇÃO OU COLO UTERINO.',
    CO_GRUPO: '02',
    groupName: 'PROCEDIMENTOS DIAGNÓSTICOS',
    CO_SUB_GRUPO: '05',
    subgroupName: 'DIAGNÓSTICO POR ULTRASSONOGRAFIA',
    CO_FORMA_ORGANIZACAO: '02',
    organizationName: 'ULTRASSONOGRAFIA',
  },
  {
    CO_PROCEDIMENTO: '0301010072',
    NO_PROCEDIMENTO: 'CONSULTA PRÉ-NATAL',
    DS_PROCEDIMENTO: 'ATENDIMENTO MÉDICO OU DE ENFERMAGEM ESPECIALIZADO À GESTANTE DURANTE O PRÉ-NATAL.',
    CO_GRUPO: '03',
    groupName: 'PROCEDIMENTOS CLÍNICOS',
    CO_SUB_GRUPO: '01',
    subgroupName: 'CONSULTAS / ATENDIMENTOS / ACOMPANHAMENTOS',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'CONSULTAS',
  },
  {
    CO_PROCEDIMENTO: '0301010129',
    NO_PROCEDIMENTO: 'CONSULTA DE PUERPÉRIO',
    DS_PROCEDIMENTO: 'AVALIAÇÃO CLÍNICA DA PUÉRPERA E DO RECÉM-NASCIDO NO PÓS-PARTO.',
    CO_GRUPO: '03',
    groupName: 'PROCEDIMENTOS CLÍNICOS',
    CO_SUB_GRUPO: '01',
    subgroupName: 'CONSULTAS / ATENDIMENTOS / ACOMPANHAMENTOS',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'CONSULTAS',
  },
  {
    CO_PROCEDIMENTO: '0301010048',
    NO_PROCEDIMENTO: 'CONSULTA MÉDICA EM ATENÇÃO ESPECIALIZADA',
    DS_PROCEDIMENTO: 'CONSULTA EM OBSTETRÍCIA DE ALTO RISCO OU MEDICINA FETAL.',
    CO_GRUPO: '03',
    groupName: 'PROCEDIMENTOS CLÍNICOS',
    CO_SUB_GRUPO: '01',
    subgroupName: 'CONSULTAS / ATENDIMENTOS / ACOMPANHAMENTOS',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'CONSULTAS',
  },
  {
    CO_PROCEDIMENTO: '0202010317',
    NO_PROCEDIMENTO: 'DOSAGEM DE GLICOSE',
    DS_PROCEDIMENTO: 'AVALIAÇÃO DA GLICEMIA EM JEJUM OU TESTE DE TOLERÂNCIA À GLICOSE (TOTG).',
    CO_GRUPO: '02',
    groupName: 'PROCEDIMENTOS DIAGNÓSTICOS',
    CO_SUB_GRUPO: '02',
    subgroupName: 'DIAGNÓSTICO EM LABORATÓRIO CLÍNICO',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'BIOQUÍMICA',
  },
  {
    CO_PROCEDIMENTO: '0202010503',
    NO_PROCEDIMENTO: 'HEMOGRAMA COMPLETO',
    DS_PROCEDIMENTO: 'AVALIAÇÃO DAS SÉRIES VERMELHA, BRANCA E PLAQUETÁRIA.',
    CO_GRUPO: '02',
    groupName: 'PROCEDIMENTOS DIAGNÓSTICOS',
    CO_SUB_GRUPO: '02',
    subgroupName: 'DIAGNÓSTICO EM LABORATÓRIO CLÍNICO',
    CO_FORMA_ORGANIZACAO: '02',
    organizationName: 'HEMATOLOGIA',
  },
  {
    CO_PROCEDIMENTO: '0202030300',
    NO_PROCEDIMENTO: 'TESTE RÁPIDO PARA DETECÇÃO DE HIV EM GESTANTE',
    DS_PROCEDIMENTO: 'TRIAGEM RÁPIDA DE IMUNOENSAIO PARA HIV EM PRÉ-NATAL E MERNIDADE.',
    CO_GRUPO: '02',
    groupName: 'PROCEDIMENTOS DIAGNÓSTICOS',
    CO_SUB_GRUPO: '02',
    subgroupName: 'DIAGNÓSTICO EM LABORATÓRIO CLÍNICO',
    CO_FORMA_ORGANIZACAO: '03',
    organizationName: 'IMUNOLOGIA',
  },
  {
    CO_PROCEDIMENTO: '0202030326',
    NO_PROCEDIMENTO: 'TESTE RÁPIDO PARA SÍFILIS EM GESTANTE',
    DS_PROCEDIMENTO: 'TRIAGEM RÁPIDA IMUNOCROMATOGRÁFICA PARA SÍFILIS EM GESTANTE.',
    CO_GRUPO: '02',
    groupName: 'PROCEDIMENTOS DIAGNÓSTICOS',
    CO_SUB_GRUPO: '02',
    subgroupName: 'DIAGNÓSTICO EM LABORATÓRIO CLÍNICO',
    CO_FORMA_ORGANIZACAO: '03',
    organizationName: 'IMUNOLOGIA',
  },
  {
    CO_PROCEDIMENTO: '0202050018',
    NO_PROCEDIMENTO: 'ANÁLISE DE URINA / EAS',
    DS_PROCEDIMENTO: 'EXAME ELEMENTAR E MICROSCÓPICO DA URINA (EAS).',
    CO_GRUPO: '02',
    groupName: 'PROCEDIMENTOS DIAGNÓSTICOS',
    CO_SUB_GRUPO: '02',
    subgroupName: 'DIAGNÓSTICO EM LABORATÓRIO CLÍNICO',
    CO_FORMA_ORGANIZACAO: '05',
    organizationName: 'URINÁLISE',
  },
  {
    CO_PROCEDIMENTO: '0202050158',
    NO_PROCEDIMENTO: 'UROCULTURA COM IDENTIFICAÇÃO DE MICROORGANISMOS',
    DS_PROCEDIMENTO: 'CULTURA DE URINA COM CONTAGEM DE COLÔNIAS E ANTIBIOGRAMA.',
    CO_GRUPO: '02',
    groupName: 'PROCEDIMENTOS DIAGNÓSTICOS',
    CO_SUB_GRUPO: '02',
    subgroupName: 'DIAGNÓSTICO EM LABORATÓRIO CLÍNICO',
    CO_FORMA_ORGANIZACAO: '05',
    organizationName: 'URINÁLISE',
  },
  {
    CO_PROCEDIMENTO: '0409060089',
    NO_PROCEDIMENTO: 'AMNIOCENTESE',
    DS_PROCEDIMENTO: 'PUNÇÃO TRANSABDOMINAL DE LÍQUIDO AMNIÓTICO GUIADA POR ULTRASSONOGRAFIA.',
    CO_GRUPO: '04',
    groupName: 'PROCEDIMENTOS CIRÚRGICOS',
    CO_SUB_GRUPO: '09',
    subgroupName: 'CIRURGIA DO SISTEMA REPRODUTOR',
    CO_FORMA_ORGANIZACAO: '06',
    organizationName: 'PUNÇÕES DIAGNÓSTICAS',
  },
  {
    CO_PROCEDIMENTO: '0411020013',
    NO_PROCEDIMENTO: 'CURETAGEM UTERINA EM ABORTAMENTO',
    DS_PROCEDIMENTO: 'ESVAZIAMENTO DA CAVIDADE UTERINA POR CURETAGEM APÓS ABORTAMENTO INCOMPLETO.',
    CO_GRUPO: '04',
    groupName: 'PROCEDIMENTOS CIRÚRGICOS',
    CO_SUB_GRUPO: '11',
    subgroupName: 'OBSTETRÍCIA',
    CO_FORMA_ORGANIZACAO: '02',
    organizationName: 'ABORTAMENTO',
  },
  {
    CO_PROCEDIMENTO: '0411020021',
    NO_PROCEDIMENTO: 'ESVAZIAMENTO DE ÚTERO ANEMBRIONADO POR ASPIRAÇÃO MANUAL INTRA-UTERINA (AMIU)',
    DS_PROCEDIMENTO: 'ESVAZIAMENTO UTERINO VACUAR MANUAL (AMIU) EM ABORTAMENTO OU GESTAÇÃO ANEMBRIONADA.',
    CO_GRUPO: '04',
    groupName: 'PROCEDIMENTOS CIRÚRGICOS',
    CO_SUB_GRUPO: '11',
    subgroupName: 'OBSTETRÍCIA',
    CO_FORMA_ORGANIZACAO: '02',
    organizationName: 'ABORTAMENTO',
  },
  {
    CO_PROCEDIMENTO: '0310010012',
    NO_PROCEDIMENTO: 'ASSISTÊNCIA AO PARTO COM DISTOCIA',
    DS_PROCEDIMENTO: 'CONDUÇÃO E ATENDIMENTO DE PARTO VAGINAL COM COMPLICAÇÃO MECÂNICA OU DINÂMICA.',
    CO_GRUPO: '03',
    groupName: 'PROCEDIMENTOS CLÍNICOS',
    CO_SUB_GRUPO: '10',
    subgroupName: 'ASSISTÊNCIA AO PARTO E PUERPÉRIO',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'ASSISTÊNCIA AO PARTO',
  },
  {
    CO_PROCEDIMENTO: '0310010055',
    NO_PROCEDIMENTO: 'ASSISTÊNCIA AO PUERPÉRIO',
    DS_PROCEDIMENTO: 'ACOMPANHAMENTO CLÍNICO E MANEJO MATERNO NO LEITO HOSPITALAR APÓS O PARTO.',
    CO_GRUPO: '03',
    groupName: 'PROCEDIMENTOS CLÍNICOS',
    CO_SUB_GRUPO: '10',
    subgroupName: 'ASSISTÊNCIA AO PARTO E PUERPÉRIO',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'ASSISTÊNCIA AO PARTO',
  },
  {
    CO_PROCEDIMENTO: '0411010050',
    NO_PROCEDIMENTO: 'SUTURA DE LACERAÇÃO DO CANAL DO PARTO',
    DS_PROCEDIMENTO: 'REPARO CIRÚRGICO DE LACERAÇÕES VAGINAIS, PERINEAIS OU CERVICAIS PÓS-PARTO.',
    CO_GRUPO: '04',
    groupName: 'PROCEDIMENTOS CIRÚRGICOS',
    CO_SUB_GRUPO: '11',
    subgroupName: 'OBSTETRÍCIA',
    CO_FORMA_ORGANIZACAO: '01',
    organizationName: 'PARTO E PUERPÉRIO',
  },
  {
    CO_PROCEDIMENTO: '0301060061',
    NO_PROCEDIMENTO: 'ATENDIMENTO DE URGÊNCIA EM GESTANTE / PUÉRPERA',
    DS_PROCEDIMENTO: 'ATENDIMENTO EM PRONTO-SOCORRO OBSTÉTRICO PARA COMPLICAÇÕES AGUDAS.',
    CO_GRUPO: '03',
    groupName: 'PROCEDIMENTOS CLÍNICOS',
    CO_SUB_GRUPO: '01',
    subgroupName: 'CONSULTAS / ATENDIMENTOS / ACOMPANHAMENTOS',
    CO_FORMA_ORGANIZACAO: '06',
    organizationName: 'ATENDIMENTO DE URGÊNCIA',
  },
];

const OFFICIAL_RELATIONS = [
  // Partos Espontâneos
  { CO_CID: 'O80', CO_PROCEDIMENTO: '0310010039', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O80.0', CO_PROCEDIMENTO: '0310010039', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O80.1', CO_PROCEDIMENTO: '0310010039', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O80.8', CO_PROCEDIMENTO: '0310010039', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O80.9', CO_PROCEDIMENTO: '0310010039', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O80', CO_PROCEDIMENTO: '0310010047', ST_PRINCIPAL: 'S' },

  // Partos por Cesariana
  { CO_CID: 'O82', CO_PROCEDIMENTO: '0411010034', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O82.0', CO_PROCEDIMENTO: '0411010034', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O82.1', CO_PROCEDIMENTO: '0411010034', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O82.8', CO_PROCEDIMENTO: '0411010034', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O82.9', CO_PROCEDIMENTO: '0411010034', ST_PRINCIPAL: 'S' },

  // Cesariana em alto risco
  { CO_CID: 'O14', CO_PROCEDIMENTO: '0411010042', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O14.1', CO_PROCEDIMENTO: '0411010042', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O15', CO_PROCEDIMENTO: '0411010042', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O15.0', CO_PROCEDIMENTO: '0411010042', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O24', CO_PROCEDIMENTO: '0411010042', ST_PRINCIPAL: 'N' },
  { CO_CID: 'O24.4', CO_PROCEDIMENTO: '0411010042', ST_PRINCIPAL: 'N' },
  { CO_CID: 'O44.1', CO_PROCEDIMENTO: '0411010042', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O45', CO_PROCEDIMENTO: '0411010042', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O45.9', CO_PROCEDIMENTO: '0411010042', ST_PRINCIPAL: 'S' },

  // Parto com Distocia
  { CO_CID: 'O81', CO_PROCEDIMENTO: '0310010012', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O81.0', CO_PROCEDIMENTO: '0310010012', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O81.4', CO_PROCEDIMENTO: '0310010012', ST_PRINCIPAL: 'S' },

  // Laceração e Sutura
  { CO_CID: 'O70', CO_PROCEDIMENTO: '0411010050', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O70.0', CO_PROCEDIMENTO: '0411010050', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O70.1', CO_PROCEDIMENTO: '0411010050', ST_PRINCIPAL: 'S' },

  // Ultrassonografia Obstétrica
  { CO_CID: 'Z34', CO_PROCEDIMENTO: '0205020143', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z34.0', CO_PROCEDIMENTO: '0205020143', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z34.8', CO_PROCEDIMENTO: '0205020143', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z34.9', CO_PROCEDIMENTO: '0205020143', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O26.8', CO_PROCEDIMENTO: '0205020143', ST_PRINCIPAL: 'N' },
  { CO_CID: 'O40', CO_PROCEDIMENTO: '0205020143', ST_PRINCIPAL: 'N' },
  { CO_CID: 'O41.0', CO_PROCEDIMENTO: '0205020143', ST_PRINCIPAL: 'N' },

  // Ultrassonografia Doppler
  { CO_CID: 'Z35', CO_PROCEDIMENTO: '0205020151', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z35.8', CO_PROCEDIMENTO: '0205020151', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O14.1', CO_PROCEDIMENTO: '0205020151', ST_PRINCIPAL: 'N' },
  { CO_CID: 'O36.3', CO_PROCEDIMENTO: '0205020151', ST_PRINCIPAL: 'N' },
  { CO_CID: 'O36.5', CO_PROCEDIMENTO: '0205020151', ST_PRINCIPAL: 'N' },

  // USG Morfológica & Transvaginal
  { CO_CID: 'Z34.0', CO_PROCEDIMENTO: '0205020160', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z35', CO_PROCEDIMENTO: '0205020160', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z32.1', CO_PROCEDIMENTO: '0205020186', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O20.0', CO_PROCEDIMENTO: '0205020186', ST_PRINCIPAL: 'N' },

  // Consultas de Pré-Natal e Puerpério
  { CO_CID: 'Z34', CO_PROCEDIMENTO: '0301010072', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z34.0', CO_PROCEDIMENTO: '0301010072', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z34.8', CO_PROCEDIMENTO: '0301010072', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z34.9', CO_PROCEDIMENTO: '0301010072', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z35', CO_PROCEDIMENTO: '0301010048', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z35.8', CO_PROCEDIMENTO: '0301010048', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z39.0', CO_PROCEDIMENTO: '0301010129', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z39.2', CO_PROCEDIMENTO: '0301010129', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O80', CO_PROCEDIMENTO: '0310010055', ST_PRINCIPAL: 'S' },

  // Abortamento e AMIU / Curetagem
  { CO_CID: 'O03', CO_PROCEDIMENTO: '0411020013', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O04', CO_PROCEDIMENTO: '0411020013', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O05', CO_PROCEDIMENTO: '0411020013', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O06', CO_PROCEDIMENTO: '0411020013', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O20.0', CO_PROCEDIMENTO: '0411020021', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O03', CO_PROCEDIMENTO: '0411020021', ST_PRINCIPAL: 'S' },

  // Exames Laboratoriais
  { CO_CID: 'Z34', CO_PROCEDIMENTO: '0202010317', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O24.4', CO_PROCEDIMENTO: '0202010317', ST_PRINCIPAL: 'N' },
  { CO_CID: 'Z34', CO_PROCEDIMENTO: '0202010503', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z34', CO_PROCEDIMENTO: '0202050018', ST_PRINCIPAL: 'S' },
  { CO_CID: 'N39.0', CO_PROCEDIMENTO: '0202050158', ST_PRINCIPAL: 'S' },
  { CO_CID: 'Z34', CO_PROCEDIMENTO: '0202030300', ST_PRINCIPAL: 'S' },
  { CO_CID: 'B20', CO_PROCEDIMENTO: '0202030300', ST_PRINCIPAL: 'N' },
  { CO_CID: 'Z34', CO_PROCEDIMENTO: '0202030326', ST_PRINCIPAL: 'S' },
  { CO_CID: 'A53.0', CO_PROCEDIMENTO: '0202030326', ST_PRINCIPAL: 'N' },

  // Urgência
  { CO_CID: 'O14.1', CO_PROCEDIMENTO: '0301060061', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O15.0', CO_PROCEDIMENTO: '0301060061', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O42.0', CO_PROCEDIMENTO: '0301060061', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O60.0', CO_PROCEDIMENTO: '0301060061', ST_PRINCIPAL: 'S' },
  { CO_CID: 'O72.0', CO_PROCEDIMENTO: '0301060061', ST_PRINCIPAL: 'S' },
];

function buildDataset() {
  const options = parseArgs();

  console.log(`[SIGTAP Build] Target competence: ${options.competence}`);
  console.log(`[SIGTAP Build] Output directory: ${options.output}`);

  let rawCids = OFFICIAL_CIDS;
  let rawProcedures = OFFICIAL_PROCEDURES;
  let rawRelations = OFFICIAL_RELATIONS;

  if (options.input && fs.existsSync(options.input)) {
    console.log(`[SIGTAP Build] Reading custom input directory: ${options.input}`);
    // If input directory provided, attempt parsing layout files
    try {
      const cidLayoutPath = path.join(options.input, 'tb_cid_layout.txt');
      const cidDataPath = path.join(options.input, 'tb_cid.txt');
      if (fs.existsSync(cidLayoutPath) && fs.existsSync(cidDataPath)) {
        const layout = parseLayoutFile(fs.readFileSync(cidLayoutPath, 'latin1'));
        rawCids = parseFixedWidthData(fs.readFileSync(cidDataPath, 'latin1'), layout);
      }

      const procLayoutPath = path.join(options.input, 'tb_procedimento_layout.txt');
      const procDataPath = path.join(options.input, 'tb_procedimento.txt');
      if (fs.existsSync(procLayoutPath) && fs.existsSync(procDataPath)) {
        const layout = parseLayoutFile(fs.readFileSync(procLayoutPath, 'latin1'));
        rawProcedures = parseFixedWidthData(fs.readFileSync(procDataPath, 'latin1'), layout);
      }

      const relLayoutPath = path.join(options.input, 'rl_procedimento_cid_layout.txt');
      const relDataPath = path.join(options.input, 'rl_procedimento_cid.txt');
      if (fs.existsSync(relLayoutPath) && fs.existsSync(relDataPath)) {
        const layout = parseLayoutFile(fs.readFileSync(relLayoutPath, 'latin1'));
        rawRelations = parseFixedWidthData(fs.readFileSync(relDataPath, 'latin1'), layout);
      }
    } catch (e) {
      console.warn('[SIGTAP Build] Error parsing input directory, falling back to official dataset:', e.message);
    }
  }

  const cids = transformCidRecords(rawCids);
  const procedures = transformProcedureRecords(rawProcedures);

  const validCidsSet = new Set(cids.map((c) => c.code));
  const validProceduresSet = new Set(procedures.map((p) => p.code));

  const relations = transformRelationRecords(rawRelations, validCidsSet, validProceduresSet);

  if (cids.length === 0 || procedures.length === 0 || relations.length === 0) {
    console.error('[SIGTAP Build Error] Dataset building failed due to empty collection counts.');
    process.exit(1);
  }

  const competenceDir = path.join(options.output, options.competence);
  const tmpDir = path.join(options.output, `.tmp-${options.competence}`);

  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  // Write temporary files
  fs.writeFileSync(path.join(tmpDir, 'cids.json'), JSON.stringify(cids, null, 2), 'utf-8');
  fs.writeFileSync(path.join(tmpDir, 'procedures.json'), JSON.stringify(procedures, null, 2), 'utf-8');
  fs.writeFileSync(path.join(tmpDir, 'relations.json'), JSON.stringify(relations, null, 2), 'utf-8');

  // Create manifest
  const counts = {
    cids: cids.length,
    procedures: procedures.length,
    relations: relations.length,
  };
  const manifest = createManifest(options.competence, counts, `/data/clinical-codes/${options.competence}`);

  // Safely swap/move tmpDir to competenceDir
  if (fs.existsSync(competenceDir)) {
    fs.rmSync(competenceDir, { recursive: true, force: true });
  }
  fs.renameSync(tmpDir, competenceDir);

  // Write top-level manifest
  fs.mkdirSync(options.output, { recursive: true });
  fs.writeFileSync(path.join(options.output, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('[SIGTAP Build Success] Created clinical codes catalog:');
  console.log(` - Competence: ${manifest.competenceLabel}`);
  console.log(` - CIDs: ${counts.cids}`);
  console.log(` - Procedures: ${counts.procedures}`);
  console.log(` - Relations: ${counts.relations}`);
}

buildDataset();
