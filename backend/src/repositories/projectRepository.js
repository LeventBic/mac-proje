const db = require('../config/database');

class ProjectRepository {
    async findAllWithFilters({ search, status, customer_id, limit, offset }) {
        let whereConditions = ['1=1'];
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`(name ILIKE $${paramIndex} OR project_code ILIKE $${paramIndex + 1} OR description ILIKE $${paramIndex + 2})`);
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            paramIndex += 3;
        }

        if (status) {
            whereConditions.push(`status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        if (customer_id) {
            whereConditions.push(`customer_id = $${paramIndex}`);
            queryParams.push(customer_id);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');
        const query = `
            SELECT * FROM projects 
            WHERE ${whereClause} 
            ORDER BY created_at DESC 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        queryParams.push(limit || 10, offset || 0);
        const result = await db.query(query, queryParams);
        return result.rows;
    }

    async countWithFilters({ search, status, customer_id }) {
        let whereConditions = ['1=1'];
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`(name ILIKE $${paramIndex} OR project_code ILIKE $${paramIndex + 1} OR description ILIKE $${paramIndex + 2})`);
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            paramIndex += 3;
        }

        if (status) {
            whereConditions.push(`status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        if (customer_id) {
            whereConditions.push(`customer_id = $${paramIndex}`);
            queryParams.push(customer_id);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');
        const countQuery = `SELECT COUNT(*) as total FROM projects WHERE ${whereClause}`;
        const result = await db.query(countQuery, queryParams);
        return parseInt(result.rows[0].total);
    }

    async findById(id) {
        const result = await db.query(
            'SELECT * FROM projects WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async findByIdWithDetails(id) {
        const result = await db.query(`
            SELECT 
                p.*,
                c.name as customer_name,
                c.contact_person as customer_contact,
                u.first_name as manager_first_name,
                u.last_name as manager_last_name
            FROM projects p
            LEFT JOIN customers c ON p.customer_id = c.id
            LEFT JOIN users u ON p.project_manager_id = u.id
            WHERE p.id = $1
        `, [id]);
        return result.rows[0] || null;
    }

    async findByProjectCode(projectCode) {
        const result = await db.query(
            'SELECT * FROM projects WHERE project_code = $1',
            [projectCode]
        );
        return result.rows[0] || null;
    }

    async create(projectData) {
        const {
            project_code, name, description, customer_id, project_manager_id,
            status = 'planning', priority = 'medium', start_date, planned_end_date,
            budget, notes, created_by
        } = projectData;

        const result = await db.query(`
            INSERT INTO projects (
                project_code, name, description, customer_id, project_manager_id,
                status, priority, start_date, planned_end_date, budget, notes, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
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

        return result.rows[0].id;
    }

    async update(id, projectData) {
        const {
            project_code, name, description, customer_id, project_manager_id,
            status, priority, start_date, planned_end_date, actual_end_date,
            budget, actual_cost, notes
        } = projectData;

        await db.query(`
            UPDATE projects SET 
                project_code = $1, name = $2, description = $3, customer_id = $4, 
                project_manager_id = $5, status = $6, priority = $7, start_date = $8, 
                planned_end_date = $9, actual_end_date = $10, budget = $11, 
                actual_cost = $12, notes = $13, updated_at = CURRENT_TIMESTAMP
            WHERE id = $14
        `, [
            project_code, name, description, customer_id, project_manager_id,
            status, priority, start_date, planned_end_date, actual_end_date,
            budget, actual_cost, notes, id
        ]);
    }

    async delete(id) {
        await db.query('DELETE FROM projects WHERE id = $1', [id]);
    }

    async getTaskCount(projectId) {
        const result = await db.query(
            'SELECT COUNT(*) as count FROM project_tasks WHERE project_id = $1',
            [projectId]
        );
        return parseInt(result.rows[0].count);
    }

    async getProjectTasks(projectId) {
        const result = await db.query(`
            SELECT 
                pt.*,
                u.first_name as assigned_to_first_name,
                u.last_name as assigned_to_last_name
            FROM project_tasks pt
            LEFT JOIN users u ON pt.assigned_to = u.id
            WHERE pt.project_id = $1
            ORDER BY pt.created_at DESC
        `, [projectId]);
        return result.rows;
    }

    async createTask(projectId, taskData) {
        const {
            title, description, assigned_to, status = 'pending',
            priority = 'medium', due_date, estimated_hours, created_by
        } = taskData;

        const result = await db.query(`
            INSERT INTO project_tasks (
                project_id, title, description, assigned_to, status,
                priority, due_date, estimated_hours, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `, [
            projectId, title, description, assigned_to, status,
            priority, due_date, estimated_hours, created_by
        ]);

        return result.rows[0].id;
    }

    async getProjectCosts(projectId) {
        const result = await db.query(`
            SELECT * FROM project_costs 
            WHERE project_id = $1 
            ORDER BY created_at DESC
        `, [projectId]);
        return result.rows;
    }

    async createCost(projectId, costData, connection = null) {
        const {
            cost_type, description, amount, cost_date = new Date(),
            supplier_id, invoice_number, notes, created_by
        } = costData;

        const dbConnection = connection || db;
        
        const result = await dbConnection.query(`
            INSERT INTO project_costs (
                project_id, cost_type, description, amount, cost_date,
                supplier_id, invoice_number, notes, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `, [
            projectId, cost_type, description, amount, cost_date,
            supplier_id, invoice_number, notes, created_by
        ]);

        // Update project total cost
        const totalCost = await this.getTotalCost(projectId, dbConnection);
        await this.updateTotalCost(projectId, totalCost, dbConnection);

        return result.rows[0].id;
    }

    async getTotalCost(projectId, connection = null) {
        const dbConnection = connection || db;
        const result = await dbConnection.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM project_costs WHERE project_id = $1',
            [projectId]
        );
        return parseFloat(result.rows[0].total);
    }

    async updateTotalCost(projectId, totalCost, connection = null) {
        const dbConnection = connection || db;
        await dbConnection.query(
            'UPDATE projects SET actual_cost = $1 WHERE id = $2',
            [totalCost, projectId]
        );
    }
}

module.exports = new ProjectRepository();