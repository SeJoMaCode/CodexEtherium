class TokenIdentifiersModel {
  final String? cardKingdomEtchedId;
  final String? cardKingdomFoilId;
  final String? cardKingdomId;
  final String? cardsphereFoilId;
  final String? cardsphereId;
  final String? deckboxId;
  final String? mcmId;
  final String? mcmMetaId;
  final String? mtgArenaId;
  final String? mtgjsonFoilVersionId;
  final String? mtgjsonNonFoilVersionId;
  final String? mtgjsonV4Id;
  final String? mtgoFoilId;
  final String? mtgoId;
  final String? multiverseId;
  final String? scryfallCardBackId;
  final String? scryfallId;
  final String? scryfallIllustrationId;
  final String? scryfallOracleId;
  final String? tcgplayerEtchedProductId;
  final String? tcgplayerProductId;
  final String? uuid;

  TokenIdentifiersModel({
    this.cardKingdomEtchedId,
    this.cardKingdomFoilId,
    this.cardKingdomId,
    this.cardsphereFoilId,
    this.cardsphereId,
    this.deckboxId,
    this.mcmId,
    this.mcmMetaId,
    this.mtgArenaId,
    this.mtgjsonFoilVersionId,
    this.mtgjsonNonFoilVersionId,
    this.mtgjsonV4Id,
    this.mtgoFoilId,
    this.mtgoId,
    this.multiverseId,
    this.scryfallCardBackId,
    this.scryfallId,
    this.scryfallIllustrationId,
    this.scryfallOracleId,
    this.tcgplayerEtchedProductId,
    this.tcgplayerProductId,
    this.uuid,
  });

  factory TokenIdentifiersModel.fromMap(Map<String, dynamic> map) {
    return TokenIdentifiersModel(
      cardKingdomEtchedId: map['cardKingdomEtchedId'] as String?,
      cardKingdomFoilId: map['cardKingdomFoilId'] as String?,
      cardKingdomId: map['cardKingdomId'] as String?,
      cardsphereFoilId: map['cardsphereFoilId'] as String?,
      cardsphereId: map['cardsphereId'] as String?,
      deckboxId: map['deckboxId'] as String?,
      mcmId: map['mcmId'] as String?,
      mcmMetaId: map['mcmMetaId'] as String?,
      mtgArenaId: map['mtgArenaId'] as String?,
      mtgjsonFoilVersionId: map['mtgjsonFoilVersionId'] as String?,
      mtgjsonNonFoilVersionId: map['mtgjsonNonFoilVersionId'] as String?,
      mtgjsonV4Id: map['mtgjsonV4Id'] as String?,
      mtgoFoilId: map['mtgoFoilId'] as String?,
      mtgoId: map['mtgoId'] as String?,
      multiverseId: map['multiverseId'] as String?,
      scryfallCardBackId: map['scryfallCardBackId'] as String?,
      scryfallId: map['scryfallId'] as String?,
      scryfallIllustrationId: map['scryfallIllustrationId'] as String?,
      scryfallOracleId: map['scryfallOracleId'] as String?,
      tcgplayerEtchedProductId: map['tcgplayerEtchedProductId'] as String?,
      tcgplayerProductId: map['tcgplayerProductId'] as String?,
      uuid: map['uuid'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'cardKingdomEtchedId': cardKingdomEtchedId,
      'cardKingdomFoilId': cardKingdomFoilId,
      'cardKingdomId': cardKingdomId,
      'cardsphereFoilId': cardsphereFoilId,
      'cardsphereId': cardsphereId,
      'deckboxId': deckboxId,
      'mcmId': mcmId,
      'mcmMetaId': mcmMetaId,
      'mtgArenaId': mtgArenaId,
      'mtgjsonFoilVersionId': mtgjsonFoilVersionId,
      'mtgjsonNonFoilVersionId': mtgjsonNonFoilVersionId,
      'mtgjsonV4Id': mtgjsonV4Id,
      'mtgoFoilId': mtgoFoilId,
      'mtgoId': mtgoId,
      'multiverseId': multiverseId,
      'scryfallCardBackId': scryfallCardBackId,
      'scryfallId': scryfallId,
      'scryfallIllustrationId': scryfallIllustrationId,
      'scryfallOracleId': scryfallOracleId,
      'tcgplayerEtchedProductId': tcgplayerEtchedProductId,
      'tcgplayerProductId': tcgplayerProductId,
      'uuid': uuid,
    };
  }
}