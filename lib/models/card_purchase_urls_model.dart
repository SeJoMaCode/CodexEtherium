class CardPurchaseUrlsModel {
  final String? cardKingdom;
  final String? cardKingdomEtched;
  final String? cardKingdomFoil;
  final String? cardmarket;
  final String? tcgplayer;
  final String? tcgplayerEtched;
  final String? uuid;

  CardPurchaseUrlsModel({
    this.cardKingdom,
    this.cardKingdomEtched,
    this.cardKingdomFoil,
    this.cardmarket,
    this.tcgplayer,
    this.tcgplayerEtched,
    this.uuid,
  });

  factory CardPurchaseUrlsModel.fromMap(Map<String, dynamic> map) {
    return CardPurchaseUrlsModel(
      cardKingdom: map['cardKingdom'] as String?,
      cardKingdomEtched: map['cardKingdomEtched'] as String?,
      cardKingdomFoil: map['cardKingdomFoil'] as String?,
      cardmarket: map['cardmarket'] as String?,
      tcgplayer: map['tcgplayer'] as String?,
      tcgplayerEtched: map['tcgplayerEtched'] as String?,
      uuid: map['uuid'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'cardKingdom': cardKingdom,
      'cardKingdomEtched': cardKingdomEtched,
      'cardKingdomFoil': cardKingdomFoil,
      'cardmarket': cardmarket,
      'tcgplayer': tcgplayer,
      'tcgplayerEtched': tcgplayerEtched,
      'uuid': uuid,
    };
  }
}