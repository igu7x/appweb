/**
 * SCRIPT DE TESTE - VALIDAÇÃO DE SEÇÕES E CAMPOS EM FORMULÁRIOS
 * 
 * Este script testa a correção do bug crítico onde campos
 * não apareciam dentro de seções nos formulários.
 * 
 * Para executar no console do navegador:
 * 1. Abrir DevTools (F12)
 * 2. Colar este código no Console
 * 3. Verificar se todos os testes passam (✅)
 */

(async function testFormSectionsAndFields() {
    console.clear();
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TESTE DE VALIDAÇÃO - SEÇÕES E CAMPOS EM FORMULÁRIOS');
    console.log('═══════════════════════════════════════════════════════\n');

    let testsPassed = 0;
    let testsFailed = 0;

    // Helper para assert
    const assert = (condition, testName, details = '') => {
        if (condition) {
            console.log(`✅ ${testName}`);
            if (details) console.log(`   ${details}`);
            testsPassed++;
        } else {
            console.error(`❌ ${testName}`);
            if (details) console.error(`   ${details}`);
            testsFailed++;
        }
    };

    try {
        // Importar formApi
        const { formApi } = await import('./src/services/formApi.ts');

        console.log('TESTE 1: Criar formulário com seção e campos\n');
        console.log('─────────────────────────────────────────────────────\n');

        // 1. Criar formulário
        const form = await formApi.createForm({
            title: 'Formulário de Teste - Seções',
            description: 'Teste automatizado de seções e campos',
            status: 'PUBLISHED',
            createdBy: 'test-user',
            directorate: 'DTI',
            allowedDirectorates: ['ALL']
        });

        assert(form && form.id, 'Formulário criado com sucesso', `ID: ${form.id}`);

        // 2. Criar seção com ID temporário
        const tempSectionId = `temp-${Date.now()}`;
        const sections = [{
            id: tempSectionId,
            formId: form.id,
            title: 'Seção de Teste',
            description: 'Descrição da seção de teste',
            order: 0
        }];

        console.log(`\nℹ️  Seção criada com ID temporário: ${tempSectionId}\n`);

        // 3. Criar campos vinculados à seção temporária
        const fields = [
            {
                id: `temp-field-1`,
                formId: form.id,
                sectionId: tempSectionId, // ⚠️ ID TEMPORÁRIO
                type: 'SHORT_TEXT',
                label: 'Nome Completo',
                required: true,
                order: 0
            },
            {
                id: `temp-field-2`,
                formId: form.id,
                sectionId: tempSectionId, // ⚠️ ID TEMPORÁRIO
                type: 'SHORT_TEXT',
                label: 'Email',
                required: true,
                order: 1
            },
            {
                id: `temp-field-3`,
                formId: form.id,
                sectionId: tempSectionId, // ⚠️ ID TEMPORÁRIO
                type: 'DATE',
                label: 'Data de Nascimento',
                required: false,
                order: 2
            }
        ];

        console.log(`ℹ️  Campos criados vinculados à seção temporária:\n`);
        fields.forEach(f => console.log(`   - "${f.label}" (ID: ${f.id}, SectionId: ${f.sectionId})`));
        console.log('');

        // 4. Salvar seções e campos (aqui acontece o mapeamento!)
        console.log('🔄 Salvando seções e campos (mapeamento de IDs)...\n');
        const { sections: savedSections, fields: savedFields } = await formApi.saveSectionsAndFields(
            form.id,
            sections,
            fields
        );

        console.log('\n─────────────────────────────────────────────────────\n');
        console.log('TESTE 2: Validar IDs após salvamento\n');
        console.log('─────────────────────────────────────────────────────\n');

        // 5. Verificar que seção recebeu novo ID
        assert(
            savedSections.length === 1,
            'Seção foi salva',
            `Total: ${savedSections.length}`
        );

        const savedSection = savedSections[0];
        assert(
            savedSection.id !== tempSectionId,
            'Seção recebeu novo ID (não é mais temporário)',
            `Novo ID: ${savedSection.id}`
        );

        assert(
            savedSection.id.startsWith('section-'),
            'Seção tem ID permanente correto',
            `ID: ${savedSection.id}`
        );

        // 6. Verificar que campos foram salvos
        assert(
            savedFields.length === 3,
            'Todos os campos foram salvos',
            `Total: ${savedFields.length}`
        );

        // 7. TESTE CRÍTICO: Verificar que sectionId dos campos foi atualizado!
        console.log('\n🔥 TESTE CRÍTICO: Validar mapeamento de sectionId\n');

        let allFieldsHaveCorrectSectionId = true;
        savedFields.forEach((field, index) => {
            const isCorrect = field.sectionId === savedSection.id;
            const status = isCorrect ? '✅' : '❌';
            console.log(`${status} Campo "${field.label}"`);
            console.log(`   - SectionId esperado: ${savedSection.id}`);
            console.log(`   - SectionId atual: ${field.sectionId}`);
            console.log(`   - Match: ${isCorrect ? 'SIM ✅' : 'NÃO ❌'}\n`);

            if (!isCorrect) allFieldsHaveCorrectSectionId = false;
        });

        assert(
            allFieldsHaveCorrectSectionId,
            '🎯 TODOS os campos têm sectionId correto (mapeamento funcionou!)',
            'Relacionamento seção → campos está correto'
        );

        console.log('\n─────────────────────────────────────────────────────\n');
        console.log('TESTE 3: Validar recuperação do formulário\n');
        console.log('─────────────────────────────────────────────────────\n');

        // 8. Buscar formulário completo (simula o que FormFiller faz)
        const formWithDetails = await formApi.getFormById(form.id);

        assert(
            formWithDetails !== null,
            'Formulário recuperado com sucesso',
            `Título: "${formWithDetails.title}"`
        );

        assert(
            formWithDetails.sections.length === 1,
            'Seção foi recuperada',
            `Total: ${formWithDetails.sections.length}`
        );

        assert(
            formWithDetails.fields.length === 3,
            'Todos os campos foram recuperados',
            `Total: ${formWithDetails.fields.length}`
        );

        console.log('\n─────────────────────────────────────────────────────\n');
        console.log('TESTE 4: Simular renderização (FormFiller)\n');
        console.log('─────────────────────────────────────────────────────\n');

        // 9. Simular a lógica do FormFiller
        const section = formWithDetails.sections[0];
        const sectionFields = formWithDetails.fields.filter(f => f.sectionId === section.id);

        console.log(`📋 Seção: "${section.title}" (ID: ${section.id})`);
        console.log(`🔍 Buscando campos com sectionId === "${section.id}"\n`);

        assert(
            sectionFields.length === 3,
            '🎯 TODOS os campos foram encontrados na seção!',
            `Campos encontrados: ${sectionFields.length}/3`
        );

        console.log('Campos encontrados:\n');
        sectionFields.forEach((field, index) => {
            console.log(`   ${index + 1}. "${field.label}"`);
            console.log(`      - Tipo: ${field.type}`);
            console.log(`      - Obrigatório: ${field.required ? 'Sim' : 'Não'}`);
            console.log(`      - SectionId: ${field.sectionId}\n`);
        });

        // 10. Verificar que nenhum campo ficou órfão
        const orphanFields = formWithDetails.fields.filter(
            f => f.sectionId && f.sectionId !== section.id
        );

        assert(
            orphanFields.length === 0,
            'Nenhum campo órfão (com sectionId inválido)',
            orphanFields.length === 0 ? 'Todos os campos têm sectionId válido' : `Campos órfãos: ${orphanFields.length}`
        );

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📊 RESULTADO DOS TESTES');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log(`Total de testes: ${testsPassed + testsFailed}`);
        console.log(`✅ Testes aprovados: ${testsPassed}`);
        console.log(`❌ Testes falhados: ${testsFailed}\n`);

        if (testsFailed === 0) {
            console.log('🎉 SUCESSO! Todos os testes passaram!');
            console.log('✅ O bug de seções vazias FOI CORRIGIDO!');
            console.log('✅ Campos aparecem corretamente dentro das seções!');
        } else {
            console.error('⚠️  ATENÇÃO! Alguns testes falharam!');
            console.error('❌ O bug pode ainda existir ou há problemas na correção!');
        }

        console.log('\n═══════════════════════════════════════════════════════\n');

        // Cleanup (remover formulário de teste)
        console.log('🧹 Limpando dados de teste...');
        await formApi.deleteForm(form.id);
        console.log('✅ Formulário de teste removido\n');

        return testsFailed === 0;

    } catch (error) {
        console.error('\n❌ ERRO DURANTE OS TESTES:\n');
        console.error(error);
        console.log('\n═══════════════════════════════════════════════════════\n');
        return false;
    }
})();
