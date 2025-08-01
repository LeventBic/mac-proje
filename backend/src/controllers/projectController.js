const projectService = require('../services/projectService')
const { AppError } = require('../utils/errors')

class ProjectController {
  async getAllProjects(req, res, next) {
    try {
      const result = await projectService.getAllProjects(req.query)

      res.json({
        status: 'success',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async getProjectById(req, res, next) {
    try {
      const { id } = req.params
      const project = await projectService.getProjectById(id)

      res.json({
        status: 'success',
        data: project
      })
    } catch (error) {
      next(error)
    }
  }

  async createProject(req, res, next) {
    try {
      const result = await projectService.createProject(req.body, req.user.id)

      res.status(201).json({
        status: 'success',
        message: 'Proje eklendi',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async updateProject(req, res, next) {
    try {
      const { id } = req.params
      const result = await projectService.updateProject(id, req.body)

      res.json({
        status: 'success',
        message: result.message
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteProject(req, res, next) {
    try {
      const { id } = req.params
      const result = await projectService.deleteProject(id)

      res.json({
        status: 'success',
        message: result.message
      })
    } catch (error) {
      next(error)
    }
  }

  async getProjectTasks(req, res, next) {
    try {
      const { id } = req.params
      const tasks = await projectService.getProjectTasks(id)

      res.json({
        status: 'success',
        data: tasks
      })
    } catch (error) {
      next(error)
    }
  }

  async addProjectTask(req, res, next) {
    try {
      const { id } = req.params
      const result = await projectService.addProjectTask(
        id,
        req.body,
        req.user.id
      )

      res.status(201).json({
        status: 'success',
        message: 'Görev eklendi',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async getProjectCosts(req, res, next) {
    try {
      const { id } = req.params
      const costs = await projectService.getProjectCosts(id)

      res.json({
        status: 'success',
        data: costs
      })
    } catch (error) {
      next(error)
    }
  }

  async addProjectCost(req, res, next) {
    try {
      const { id } = req.params
      const result = await projectService.addProjectCost(
        id,
        req.body,
        req.user.id
      )

      res.status(201).json({
        status: 'success',
        message: 'Maliyet eklendi',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async updateProjectStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status } = req.body
      const result = await projectService.updateProjectStatus(id, status)

      res.json({
        status: 'success',
        message: 'Proje durumu güncellendi',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async updateProjectTask(req, res, next) {
    try {
      const { id, taskId } = req.params
      const result = await projectService.updateProjectTask(
        id,
        taskId,
        req.body
      )

      res.json({
        status: 'success',
        message: 'Görev güncellendi',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteProjectTask(req, res, next) {
    try {
      const { id, taskId } = req.params
      const result = await projectService.deleteProjectTask(id, taskId)

      res.json({
        status: 'success',
        message: 'Görev silindi'
      })
    } catch (error) {
      next(error)
    }
  }

  async getProjectTimeline(req, res, next) {
    try {
      const { id } = req.params
      const timeline = await projectService.getProjectTimeline(id)

      res.json({
        status: 'success',
        data: timeline
      })
    } catch (error) {
      next(error)
    }
  }

  async getProjectReport(req, res, next) {
    try {
      const { id } = req.params
      const report = await projectService.getProjectReport(id)

      res.json({
        status: 'success',
        data: report
      })
    } catch (error) {
      next(error)
    }
  }

  async exportProject(req, res, next) {
    try {
      const { id } = req.params
      const result = await projectService.exportProject(id)

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=proje_${id}.xlsx`
      )
      res.send(result)
    } catch (error) {
      next(error)
    }
  }

  async getProjectAnalytics(req, res, next) {
    try {
      const analytics = await projectService.getProjectAnalytics(req.query)

      res.json({
        status: 'success',
        data: analytics
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new ProjectController()
