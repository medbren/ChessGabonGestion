import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  // Cette méthode est exécutée avant chaque route protégée.
  // Son rôle est de vérifier que l'utilisateur possède un token JWT valide.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Récupération de la requête HTTP.
    const request = context.switchToHttp().getRequest();

    // Lecture de l'en-tête Authorization.
    const authHeader = request.headers.authorization;

    // Si aucun token n'est fourni, accès refusé.
    if (!authHeader) {
      throw new UnauthorizedException('Token manquant');
    }

    // Format attendu :
    // Authorization: Bearer eyJhbGciOi...
    const [type, token] = authHeader.split(' ');

    // Vérification du format Bearer.
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token invalide');
    }

    try {
      // Vérifie la signature du JWT avec la clé secrète.
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'secret_bts_sio',
      });

      // On ajoute les informations du token dans la requête.
      // Elles seront ensuite accessibles dans les contrôleurs.
      request.user = payload;

      return true;
    } catch {
      // Token expiré ou falsifié.
      throw new UnauthorizedException('Token expiré ou invalide');
    }
  }
}