const db = require('../config/database');

class ProjectRepository {
    async findAllWithFilters({ search, status, customer_id, limit, offset }) {
        // En basit query
        const query = `SELECT * FROM projects ORDER BY created_at DESC LIMIT 10`;
        const [projects] = await db.pool.execute(query);
        return projects;
    }

    async countWithFilters({ search, status, customer_id }) {
        let whereConditions = ['1=1'];
        let queryParams = [];

        if (search) {
            whereConditions.push('(p.name LIKE ? OR p.project_code LIKE ? OR p.description LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status) {
            whereConditions.push('p.status = ?');
            queryParams.push(status);
        }

        if (customer_id) {
            whereConditions.push('p.customer_id = ?');
            queryParams.push(customer_id);
        }

        const whereClause = whereConditions.join(' AND ');
        const countQuery = `SELECT COUNT(*) as total FROM projects p WHERE ${whereClause}`;
        const [countResult] = await db.pool.execute(countQuery, queryParams);
        return countResult[0].total;
    }

    async findById(id) {
        const [result] = await db.pool.execute(
            'SELECT * FROM projects WHERE id = ?',
            [id]
        );
        return result[0] || null;
    }

    async findByIdWithDetails(id) {
        const [result] = await db.pool.execute(`
            SELECT 
                p.*,
                c.name as customer_name,
                c.contact_person as customer_contact,
                u.first_name as manager_first_name,
                u.last_name as manager_last_name
            FROM projects p
            LEFT JOIN customers c ON p.customer_id = c.id
            LEFT JOIN users u ON p.project_manager_id = u.id
            WHERE p.id = ?
        `, [id]);
        return result[0] || null;
    }

    async findByProjectCode(projectCode) {
        const [result] = await db.pool.execute(
            'SELECT * FROM projects WHERE project_code = ?',
            [projectCode]
        );
        return result[0] || null;
    }

    async create(projectData) {
        const {
            project_code, name, description, customer_id, project_manager_id,
            status = 'planning', priority = 'medium', start_date, planned_end_date,
            budget, notes, created_by
        } = projectData;

        const [result] = await db.pool.execute(`
            INSERT INTO projects (
                project_code, name, description, customer_id, project_manager_id,
                status, priority, start_date, planned_end_date, budget, notes, created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            project_code, 
            name, 
            description || null, 
            customer_id || null, 
            project_manager_id || null,
            status, 
            priority, 
            start_date || null, 
            planned_end_date || null, 
            budget || null, 
            notes || null, 
            created_by
        ]);

        return result.insertId;
    }

    async update(id, projectData) {
        const {
            project_code, name, description, customer_id, project_manager_id,
            status, priority, start_date, planned_end_date, actual_end_date,
            budget, actual_cost, progress_percentage, notes
        } = projectData;

        await db.pool.execute(`
            UPDATE projects 
            SET project_code = ?, name = ?, description = ?, customer_id = ?, project_manager_id = ?,
                status = ?, priority = ?, start_date = ?, planned_end_date = ?, actual_end_date = ?,
                budget = ?, actual_cost = ?, progress_percentage = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        `, [
            project_code, name, description, customer_id, project_manager_id,
            status, priority, start_date, planned_end_date, actual_end_date,
            budget, actual_cost, progress_percentage, notes, id
        ]);
    }

    async delete(id) {
        await db.pool.execute('DELETE FROM projects WHERE id = ?', [id]);
    }

    async getTaskCount(projectId) {
        const [result] = await db.pool.execute(
            'SELECT COUNT(*) as count FROM project_tasks WHERE project_id = ?',
            [projectId]
        );
        return result[0].count;
    }

    async getProjectTasks(projectId) {
        const [tasks] = await db.pool.execute(`
            SELECT 
                pt.*,
                u.first_name as assigned_first_name,
                u.last_name as assigned_last_name
            FROM project_tasks pt
            LEFT JOIN users u ON pt.assigned_user_id = u.id
            WHERE pt.project_id = ?
            ORDER BY pt.due_date ASC
        `, [projectId]);
        return tasks;
    }

    async createTask(projectId, taskData) {
        const {
            task_name, description, assigned_user_id, status = 'not_started',
            priority = 'medium', start_date, due_date, estimated_hours,
            dependencies, notes, created_by
        } = taskData;

        const [result] = await db.pool.execute(`
            INSERT INTO project_tasks (
                project_id, task_name, description, assigned_user_id, status, priority,
                start_date, due_date, estimated_hours, dependencies, notes, created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            projectId, task_name, description, assigned_user_id || null, status, priority,
            start_date || null, due_date || null, estimated_hours || null, dependencies || null, notes || null, created_by
        ]);

        return result.insertId;
    }

    async getProjectCosts(projectId) {
        const [costs] = await db.pool.execute(`
            SELECT pc.*
            FROM project_costs pc
            WHERE pc.project_id = ?
            ORDER BY pc.created_at DESC
        `, [projectId]);
        return costs;
    }

    async createCost(projectId, costData, connection = null) {
        const executor = connection || db.pool;
        const {
            cost_type, description, amount, currency = 'TRY',
            cost_date, supplier_id, invoice_number, notes, created_by
        } = costData;

        const [result] = await executor.execute(`
            INSERT INTO project_costs (
                project_id, cost_type, description, amount, currency,
                cost_date, supplier_id, invoice_number, notes, created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            projectId, 
            cost_type, 
            description, 
            amount, 
            currency,
            cost_date || null, 
            supplier_id || null, 
            invoice_number || null, 
            notes || null, 
            created_by
        ]);

        return result.insertId;
    }

    async getTotalCost(projectId, connection = null) {
        const executor = connection || db.pool;
        const [result] = await executor.execute(
            'SELECT SUM(amount) as total FROM project_costs WHERE project_id = ?',
            [projectId]
        );
        return result[0].total || 0;
    }

    async updateTotalCost(projectId, totalCost, connection = null) {
        const executor = connection || db.pool;
        await executor.execute(
            'UPDATE projects SET actual_cost = ? WHERE id = ?',
            [totalCost, projectId]
        );
    }
}

module.exports = new ProjectRepository();