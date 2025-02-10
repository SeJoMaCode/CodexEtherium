class CardLegalitiesModel {
  final String? alchemy;
  final String? brawl;
  final String? commander;
  final String? duel;
  final String? explorer;
  final String? future;
  final String? gladiator;
  final String? historic;
  final String? legacy;
  final String? modern;
  final String? oathbreaker;
  final String? oldschool;
  final String? pauper;
  final String? paupercommander;
  final String? penny;
  final String? pioneer;
  final String? predh;
  final String? premodern;
  final String? standard;
  final String? standardbrawl;
  final String? timeless;
  final String? uuid;
  final String? vintage;

  CardLegalitiesModel({
    this.alchemy,
    this.brawl,
    this.commander,
    this.duel,
    this.explorer,
    this.future,
    this.gladiator,
    this.historic,
    this.legacy,
    this.modern,
    this.oathbreaker,
    this.oldschool,
    this.pauper,
    this.paupercommander,
    this.penny,
    this.pioneer,
    this.predh,
    this.premodern,
    this.standard,
    this.standardbrawl,
    this.timeless,
    this.uuid,
    this.vintage,
  });

  factory CardLegalitiesModel.fromMap(Map<String, dynamic> map) {
    return CardLegalitiesModel(
      alchemy: map['alchemy'] as String?,
      brawl: map['brawl'] as String?,
      commander: map['commander'] as String?,
      duel: map['duel'] as String?,
      explorer: map['explorer'] as String?,
      future: map['future'] as String?,
      gladiator: map['gladiator'] as String?,
      historic: map['historic'] as String?,
      legacy: map['legacy'] as String?,
      modern: map['modern'] as String?,
      oathbreaker: map['oathbreaker'] as String?,
      oldschool: map['oldschool'] as String?,
      pauper: map['pauper'] as String?,
      paupercommander: map['paupercommander'] as String?,
      penny: map['penny'] as String?,
      pioneer: map['pioneer'] as String?,
      predh: map['predh'] as String?,
      premodern: map['premodern'] as String?,
      standard: map['standard'] as String?,
      standardbrawl: map['standardbrawl'] as String?,
      timeless: map['timeless'] as String?,
      uuid: map['uuid'] as String?,
      vintage: map['vintage'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'alchemy': alchemy,
      'brawl': brawl,
      'commander': commander,
      'duel': duel,
      'explorer': explorer,
      'future': future,
      'gladiator': gladiator,
      'historic': historic,
      'legacy': legacy,
      'modern': modern,
      'oathbreaker': oathbreaker,
      'oldschool': oldschool,
      'pauper': pauper,
      'paupercommander': paupercommander,
      'penny': penny,
      'pioneer': pioneer,
      'predh': predh,
      'premodern': premodern,
      'standard': standard,
      'standardbrawl': standardbrawl,
      'timeless': timeless,
      'uuid': uuid,
      'vintage': vintage,
    };
  }
}