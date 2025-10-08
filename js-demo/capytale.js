// Import de getSocket depuis le CDN Capytale (mise à jour automatique)
import { getSocket } from 'https://cdn.ac-paris.fr/capytale/contracts/1.0/app-agent.min.js';
// Imports liés à l'application
import { getQuestions, setQuestions, onQuestionsChange, updateAnswerContainer, setAnswers, onAnswersChange, answerSurvey, showApp, getAnswers, correctSurvey, changeTheme } from './script.js';
export function initCapytale() {
    const socket = getSocket();
    // Phase 1 : implémenter le côté "application" des contrats
    // exemple de contrat simple, on a une seule fonction à implémenter
    socket.plug("theme:1", (_dist) => ({
        setTheme(theme) {
            if (theme !== "light" && theme !== "dark") {
                throw new Error("Thème non supporté : " + theme);
            }
            changeTheme(theme);
        },
    }));
    // on n'utilise pas l'information envoyée par Capytale, on la demande
    // nous-même plus tard, mais il faut quand même "plugger" le contrat
    socket.plug("mode:1", (_dist) => ({
        setMode(mode) {
            console.log("Mode changé :", mode);
        },
    }));
    // contrat plus complexe : on ajoute autre paramètre entre le nom du contrat
    // et la fonction : un tableau des contrats dont on a besoin pour
    // implémenter le premier. La fonction reçoit alors un deuxième paramètre :
    // un tableau des objets implémentant le côté Capytale des contrats
    // demandés.
    socket.plug("separate-contents(json):1", ["mode"], (_dist, [r_mode]) => ({
        contentSaved() {
            console.log("Contenu bien sauvegardé");
        },
        getActivityContent() {
            return getQuestions();
        },
        getAssignmentContent() {
            return getAnswers();
        },
        // on peut implémenter une fonction de manière synchrone ou asynchrone
        async loadContent(activity, assignment) {
            // Avant d'utiliser l'interface distante d'un contrat (.i), c'est mieux
            // de vérifier que le contrat est bien disponible (version > 0)
            if (r_mode.version === 0) {
                throw new Error("Mode non accessible.");
            }
            if (activity) {
                setQuestions(activity, false);
                // utilisation de l'interface distante du contrat "mode"
                const mode = await r_mode.i.getCurrentMode();
                updateAnswerContainer(mode === "review"
                    ? "correct"
                    : mode === "assignment"
                        ? "answer"
                        : "preview");
                if (assignment) {
                    setAnswers(assignment, false);
                }
            }
        },
    }));
    // Quand on a fini de "plugger" tous les contrats, on appelle plugsDone()
    socket.plugsDone();
    // Phase 2 : utiliser les contrats (on peut le faire à l'initialisation
    // comme ici, mais aussi plus tard, en réponse à des actions de l'utilisateur
    // par exemple)
    // la fonction passée à socket.use() est appelée immédiatement et reçoit
    // en paramètre les interfaces distantes des contrats demandés
    socket.use(["mode", "separate-contents(json)"], async ([r_mode, r_sc]) => {
        // on vérifie que les contrats sont bien disponibles
        if (r_sc.version === 0) {
            console.warn("Separate contents not accessible.");
            return;
        }
        if (r_mode.version === 0) {
            console.warn("Mode not accessible.");
            return;
        }
        const mode = await r_mode.i.getCurrentMode();
        // on peut utiliser les interfaces distantes dans des callbacks
        if (mode == "create") {
            onQuestionsChange(() => r_sc.i.contentChanged());
        }
        else if (mode == "assignment" || mode == "review") {
            onAnswersChange(() => r_sc.i.contentChanged());
        }
        // on peut aussi les utiliser immédiatement (ici on choisit le bon affichage
        // pour l'application en fonction du mode courant)
        if (mode == "review") {
            correctSurvey();
        }
        else if (mode == "assignment") {
            answerSurvey();
        }
        else if (mode == "view") {
            answerSurvey();
        }
        // par défaut, l'application est cachée par un écran de chargement
        // on l'affiche quand on a fini d'initialiser l'interface
        showApp();
    });
}
//# sourceMappingURL=capytale.js.map