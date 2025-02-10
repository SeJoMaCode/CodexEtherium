class CardRulingsModel {
  final DateTime? date;
  final String? text;
  final String uuid;

  CardRulingsModel({
    this.date,
    this.text,
    required this.uuid,
  });

  factory CardRulingsModel.fromMap(Map<String, dynamic> map) {
    DateTime? rulingDate;
    if (map['date'] != null) {
      rulingDate = DateTime.tryParse(map['date'] as String);
    }
    return CardRulingsModel(
      date: rulingDate,
      text: map['text'] as String?,
      uuid: map['uuid'] as String,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'date': date?.toIso8601String(),
      'text': text,
      'uuid': uuid,
    };
  }
}