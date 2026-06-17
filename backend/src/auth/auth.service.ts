import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Méthode utilisée une seule fois pour créer le premier administrateur.
  // Elle empêche la création de plusieurs comptes admin via /auth/setup.
  async setup(email: string, password: string) {
    const existingAdmin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      throw new BadRequestException('Un administrateur existe déjà');
    }

    // Le mot de passe n'est jamais stocké en clair.
    // bcrypt.hash() le transforme en version chiffrée.
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    return {
      message: 'Administrateur créé',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // Méthode de connexion administrateur.
  // Elle vérifie l'email, le mot de passe, puis génère un token JWT.
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Compare le mot de passe saisi avec le mot de passe chiffré en base.
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Le token JWT permet ensuite d'accéder aux routes protégées.
    // Il contient l'id, l'email et le rôle de l'utilisateur connecté.
    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}