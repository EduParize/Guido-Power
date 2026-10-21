
import { Router, Request, Response, NextFunction } from "express";
import { createUsuarioService } from "../../configuration/factory/usuario.factory";

const router = Router();
const usuarioService = createUsuarioService();

// GET /api/usuarios
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarios = await usuarioService.list();
    res.status(200).json(usuarios);
  } catch (error) {
    next(error);
  }
});

// GET /api/usuarios/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      res.status(400).json({ message: "ID é obrigatório" });
      return;
    }

    const usuario = await usuarioService.findById(id);
    res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
});

// POST /api/usuarios
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, email, senhaHash } = req.body;

    if (
      typeof nome !== "string" || !nome.trim() ||
      typeof email !== "string" || !email.trim() ||
      typeof senhaHash !== "string" || !senhaHash.trim()
    ) {
      res.status(400).json({
        message: "nome, email e senhaHash devem ser strings não vazias",
      });
      return;
    }

    const usuario = await usuarioService.create({
      nome: nome.trim(),
      email: email.trim(),
      senhaHash,
    });

    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
});

// PUT /api/usuarios/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      res.status(400).json({ message: "ID é obrigatório" });
      return;
    }

    const { nome, email, senhaHash } = req.body;

    if (
      (nome !== undefined && (typeof nome !== "string" || !nome.trim())) ||
      (email !== undefined && (typeof email !== "string" || !email.trim())) ||
      (senhaHash !== undefined && (typeof senhaHash !== "string" || !senhaHash.trim()))
    ) {
      res.status(400).json({
        message: "Os campos informados devem ser strings não vazias",
      });
      return;
    }

    if (nome === undefined && email === undefined && senhaHash === undefined) {
      res.status(400).json({ message: "Informe ao menos um campo para atualizar" });
      return;
    }

    const usuario = await usuarioService.update(id, {
      ...(nome !== undefined && { nome: nome.trim() }),
      ...(email !== undefined && { email: email.trim() }),
      ...(senhaHash !== undefined && { senhaHash }),
    });

    res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/usuarios/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      res.status(400).json({ message: "ID é obrigatório" });
      return;
    }

    await usuarioService.delete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
