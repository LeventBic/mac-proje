const express = require('express');
const router = express.Router();
const { requireAuth: authenticateToken, requireRole } = require('../middleware/auth');
const projectController = require('../controllers/projectController');
const {
    createProjectSchema,
    updateProjectSchema,
    createTaskSchema,
    createCostSchema,
    queryParamsSchema,
    validateRequest,
    validateQuery
} = require('../validators/projectValidators');

// Tüm projeleri listele
router.get('/', authenticateToken, validateQuery(queryParamsSchema), projectController.getAllProjects);

// Yeni proje ekle
router.post('/', authenticateToken, requireRole('admin', 'operator'), validateRequest(createProjectSchema), projectController.createProject);

// Proje detaylarını getir
router.get('/:id', authenticateToken, projectController.getProjectById);

// Proje güncelle
router.put('/:id', authenticateToken, requireRole('admin', 'operator'), validateRequest(updateProjectSchema), projectController.updateProject);

// Proje sil
router.delete('/:id', authenticateToken, requireRole('admin'), projectController.deleteProject);

// Proje görevleri
router.get('/:id/tasks', authenticateToken, projectController.getProjectTasks);

// Proje görevi ekle
router.post('/:id/tasks', authenticateToken, requireRole('admin', 'operator'), validateRequest(createTaskSchema), projectController.addProjectTask);

// Proje maliyetleri
router.get('/:id/costs', authenticateToken, projectController.getProjectCosts);

// Proje maliyeti ekle
router.post('/:id/costs', authenticateToken, requireRole('admin', 'operator'), validateRequest(createCostSchema), projectController.addProjectCost);

module.exports = router;