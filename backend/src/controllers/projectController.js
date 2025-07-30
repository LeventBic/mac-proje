const projectService = require('../services/projectService');
const { AppError } = require('../utils/errors');

class ProjectController {
    async getAllProjects(req, res, next) {
        try {
            const result = await projectService.getAllProjects(req.query, req.query);
            
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getProjectById(req, res, next) {
        try {
            const { id } = req.params;
            const project = await projectService.getProjectById(id);
            
            res.json({
                status: 'success',
                data: project
            });
        } catch (error) {
            next(error);
        }
    }

    async createProject(req, res, next) {
        try {
            const result = await projectService.createProject(req.body, req.user.id);
            
            res.status(201).json({
                status: 'success',
                message: 'Proje eklendi',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProject(req, res, next) {
        try {
            const { id } = req.params;
            const result = await projectService.updateProject(id, req.body);
            
            res.json({
                status: 'success',
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteProject(req, res, next) {
        try {
            const { id } = req.params;
            const result = await projectService.deleteProject(id);
            
            res.json({
                status: 'success',
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    async getProjectTasks(req, res, next) {
        try {
            const { id } = req.params;
            const tasks = await projectService.getProjectTasks(id);
            
            res.json({
                status: 'success',
                data: tasks
            });
        } catch (error) {
            next(error);
        }
    }

    async addProjectTask(req, res, next) {
        try {
            const { id } = req.params;
            const result = await projectService.addProjectTask(id, req.body, req.user.id);
            
            res.status(201).json({
                status: 'success',
                message: 'Görev eklendi',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getProjectCosts(req, res, next) {
        try {
            const { id } = req.params;
            const costs = await projectService.getProjectCosts(id);
            
            res.json({
                status: 'success',
                data: costs
            });
        } catch (error) {
            next(error);
        }
    }

    async addProjectCost(req, res, next) {
        try {
            const { id } = req.params;
            const result = await projectService.addProjectCost(id, req.body, req.user.id);
            
            res.status(201).json({
                status: 'success',
                message: 'Maliyet eklendi',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProjectController();