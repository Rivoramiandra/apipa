// schedulers/apScheduler.js
import cron from 'node-cron';
import ApModel from '../models/ApModel.js';

class ApScheduler {
    static init() {
        console.log('⏰ Initialisation du planificateur AP...');
        
        // Vérification au démarrage (après 10 secondes)
        setTimeout(() => {
            this.checkOnStartup();
        }, 10000);
        
        // 📅 Vérification quotidienne à 8h00, 12h00, 16h00
        cron.schedule('0 8,12,16 * * *', async () => {
            console.log('🕗 [CRON] Vérification automatique des AP en retard...');
            await this.checkOverdueAPs('programmée');
        });
        
        console.log('✅ Planificateur AP initialisé avec vérifications programmées');
    }
    
    static async checkOnStartup() {
        try {
            console.log('🚀 Vérification des AP en retard au démarrage du serveur...');
            const results = await ApModel.checkAndUpdateOverdueAPs();
            
            this.logResults('démarrage', results);
            
        } catch (error) {
            console.error('💥 Erreur lors de la vérification au démarrage:', error);
        }
    }
    
    static async checkOverdueAPs(type = 'automatique') {
        try {
            console.log(`🔍 Début de la vérification ${type} des AP en retard...`);
            const results = await ApModel.checkAndUpdateOverdueAPs();
            
            this.logResults(type, results);
            
            return results;
        } catch (error) {
            console.error(`❌ Erreur lors de la vérification ${type}:`, error);
            throw error;
        }
    }
    
    static logResults(type, results) {
        const timestamp = new Date().toLocaleString('fr-FR');
        
        if (results.successfulUpdates > 0) {
            console.log(`🎉 [${timestamp}] Vérification ${type} RÉUSSIE: ${results.successfulUpdates} AP(s) mis à jour`);
        } else {
            console.log(`ℹ️ [${timestamp}] Vérification ${type}: Aucun AP en retard trouvé`);
        }
    }
}

export default ApScheduler;