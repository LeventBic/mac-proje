const db = require('../config/database');
const projectRepository = require('../repositories/projectRepository');
const { AppError } = require('../utils/errors');

class ProjectService {
    async getAllProjects(filters) {
        const { page = 1, limit = 10, search, status, customer_id, is_active } = filters;
        const offset = (page - 1) * limit;

        const projects = await projectRepository.findAllWithFilters({
            search,
            status,
            customer_id,
            is_active,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const totalCount = await projectRepository.countWithFilters({
            search,
            status,
            customer_id,
            is_active
        });

        return {
            projects,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        };
    }

    async getProjectById(id) {
        const project = await projectRepository.findByIdWithDetails(id);
        if (!project) {
            throw new AppError('Proje bulunamadı', 404);
        }

        const tasks = await projectRepository.getProjectTasks(id);
        const costs = await projectRepository.getProjectCosts(id);

        return {
            ...project,
            tasks,
            costs
        };
    }

    async createProject(projectData, userId) {
        const { project_code, name } = projectData;
        
        if (!project_code || !name) {
            throw new AppError('Proje kodu ve adı zorunludur', 400);
        }

        // Check if project code already exists
        const existingProject = await projectRepository.findByProjectCode(project_code);
        if (existingProject) {
            throw new AppError('Bu proje kodu zaten kullanılıyor', 400);
        }

        const projectId = await projectRepository.create({
            ...projectData,
            created_by: userId
        });

        return { id: projectId };
    }

    async updateProject(id, projectData) {
        const existingProject = await projectRepository.findById(id);
        if (!existingProject) {
            throw new AppError('Proje bulunamadı', 404);
        }

        await projectRepository.update(id, projectData);
        return { message: 'Proje güncellendi' };
    }

    async deleteProject(id) {
        const project = await projectRepository.findById(id);
        if (!project) {
            throw new AppError('Proje bulunamadı', 404);
        }

        await projectRepository.delete(id);
        return { message: 'Proje silindi' };
    }

    async getProjectTasks(projectId) {
        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw new AppError('Proje bulunamadı', 404);
        }

        return await projectRepository.getProjectTasks(projectId);
    }

    async addProjectTask(projectId, taskData, userId) {
        const { task_name } = taskData;
        
        if (!task_name) {
            throw new AppError('Görev adı zorunludur', 400);
        }

        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw new AppError('Proje bulunamadı', 404);
        }

        const taskId = await projectRepository.createTask(projectId, {
            ...taskData,
            created_by: userId
        });

        return { id: taskId };
    }

    async getProjectCosts(projectId) {
        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw new AppError('Proje bulunamadı', 404);
        }

        return await projectRepository.getProjectCosts(projectId);
    }

    async addProjectCost(projectId, costData, userId) {
        const { cost_type, description, amount, cost_date } = costData;
        
        if (!cost_type || !description || !amount || !cost_date) {
            throw new AppError('Maliyet türü, açıklama, tutar ve tarih zorunludur', 400);
        }

        const project = await projectRepository.findById(projectId);
        if (!project) {
            throw new AppError('Proje bulunamadı', 404);
        }

        // Use transaction for cost addition and project update
        const connection = await db.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Add cost
            const costId = await projectRepository.createCost(projectId, {
                ...costData,
                created_by: userId
            }, connection);

            // Update project total cost
            const totalCost = await projectRepository.getTotalCost(projectId, connection);
            await projectRepository.updateTotalCost(projectId, totalCost, connection);

            await connection.commit();
            return { id: costId };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new ProjectService();