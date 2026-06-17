import { Controller, Get, Query } from '@nestjs/common';
import { RankingsService } from './rankings.service';

// Contrôleur chargé de gérer toutes les routes liées aux classements.
// URL de base : /rankings
@Controller('rankings')
export class RankingsController {
  constructor(private service: RankingsService) {}

  // Route :
  // GET /rankings
  //
  // Permet de récupérer un classement.
  //
  // Exemples :
  // /rankings
  // /rankings?timeControl=BLITZ
  // /rankings?timeControl=RAPID
  // /rankings?type=monthly&month=6&year=2026
  // /rankings?type=yearly&year=2026
  @Get()
  findAll(
    @Query('type') type?: 'general' | 'monthly' | 'yearly',

    // Mois utilisé pour les classements mensuels.
    @Query('month') month?: string,

    // Année utilisée pour les classements mensuels et annuels.
    @Query('year') year?: string,

    // Filtre sur la cadence.
    @Query('timeControl')
    timeControl?: 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL',
  ) {
    return this.service.findAll({
      type: type || 'general',

      // Conversion des paramètres URL en nombres.
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,

      timeControl,
    });
  }

  // Route :
  // GET /rankings/dashboard
  //
  // Retourne les statistiques générales de l'application :
  // - nombre de membres
  // - nombre de tournois
  // - nombre de résultats
  // - dernier tournoi importé
  // - top 5 des joueurs
  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }
}